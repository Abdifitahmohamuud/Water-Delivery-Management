import prisma from "../lib/prisma.js";

/**
 * Helper: Stock restore step (runs only when refundType === FULL and status becomes REFUNDED).
 * Must be idempotent — guarded with stockRestored, never restock twice for the same refund.
 */
export async function restoreStockForFullRefund(refundId) {
  await prisma.$transaction(async (tx) => {
    const refund = await tx.refund.findUniqueOrThrow({
      where: { id: refundId },
      include: { order: { include: { items: true } } },
    });

    if (refund.refundType !== "FULL" || refund.stockRestored) return; // guard

    for (const item of refund.order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });

      await tx.inventoryLog.create({
        data: {
          productId: item.productId,
          type: "RETURNED",
          quantity: item.quantity,
          note: `Order ${refund.orderId} cancelled + fully refunded — stock restored`,
        },
      });
    }

    await tx.refund.update({
      where: { id: refundId },
      data: { stockRestored: true, stockRestoredAt: new Date() },
    });
  });
}

/**
 * POST /api/orders/:id/cancel
 * Body: { reason, refundedNow, amount, refundType, adminId }
 */
export const cancelOrderWithRefund = async (req, res) => {
  const { id } = req.params;
  const { reason, refundedNow, amount, refundType = "FULL", adminId } = req.body;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ message: "Reason for cancellation is required" });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true, refund: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is already locked (REFUNDED)
    if (order.refund?.status === "REFUNDED") {
      return res.status(400).json({ message: "Order cancellation and refund is already completed and locked." });
    }

    // Count approved payments for this order
    const paymentsCount = await prisma.payment.count({
      where: {
        orderId: id,
        status: "APPROVED",
      },
    });

    // Check if the order has any payment (via explicit Payment rows or paid status)
    const hasPayment = paymentsCount > 0 || ["FULLY_PAID", "DEPOSIT_PAID"].includes(order.paymentStatus);

    // Update order status to CANCELLED
    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    const performingAdminId = adminId || req.user?.id || null;
    const isRefundedNow = Boolean(refundedNow === true || refundedNow === "true" || refundedNow === "Yes");
    let refundAmount = amount !== undefined && amount !== null ? parseFloat(amount) : order.totalAmount;
    
    // Amount upper bound validation
    if (refundAmount > order.totalAmount) {
      refundAmount = order.totalAmount;
    }

    // Input validation: Must be greater than 0 if mark refunded now
    if (isRefundedNow && refundAmount <= 0) {
      return res.status(400).json({ message: "Lacagta la celinayo waa in ay ka badnaataa eber ($0) mar haddii la xaqiijiyay in lacagtii la celiyay." });
    }

    // Automatically set type: FULL if 100% of order total is refunded, else PARTIAL
    const activeRefundType = refundAmount >= order.totalAmount ? "FULL" : "PARTIAL";

    let refundStatus = "PENDING";
    let confirmedBy = null;
    let confirmedAt = null;
    let requestedBy = null;

    if (isRefundedNow) {
      refundStatus = "REFUNDED";
      confirmedBy = performingAdminId;
      confirmedAt = new Date();
    } else if (!hasPayment) {
      refundStatus = "NOT_REQUIRED";
    } else {
      refundStatus = "PENDING";
      requestedBy = performingAdminId;
    }

    let refund;
    if (order.refund) {
      refund = await prisma.refund.update({
        where: { id: order.refund.id },
        data: {
          amount: refundAmount,
          status: refundStatus,
          refundType: activeRefundType,
          reason,
          paymentsCount,
          requestedBy: requestedBy || order.refund.requestedBy,
          confirmedBy: confirmedBy || order.refund.confirmedBy,
          confirmedAt: confirmedAt || order.refund.confirmedAt,
        },
      });
    } else {
      refund = await prisma.refund.create({
        data: {
          orderId: id,
          amount: refundAmount,
          status: refundStatus,
          refundType: activeRefundType,
          reason,
          paymentsCount,
          requestedBy,
          confirmedBy,
          confirmedAt,
        },
      });
    }

    if (refund.status === "REFUNDED" && refund.refundType === "FULL") {
      await restoreStockForFullRefund(refund.id);
    }

    if (refund.status === "REFUNDED") {
      const existingRefundTransaction = await prisma.transaction.findFirst({
        where: { orderId: id, type: "REFUND" },
      });
      if (!existingRefundTransaction) {
        await prisma.transaction.create({
          data: {
            orderId: id,
            type: "REFUND",
            amount: refundAmount,
            description: `Refund for cancelled Order #${id.slice(0, 8)}`,
            status: "COMPLETED",
          },
        });
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.to(id).emit("statusUpdate", { status: "CANCELLED" });
    }

    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: { refund: true, payments: true, items: true, user: { select: { name: true, email: true } } },
    });

    return res.status(200).json({
      message: "Order cancelled successfully",
      order: updatedOrder,
      refund,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/refunds/:id/confirm
 * Body: { adminId, amount, refundType, refundedNow, reason }
 */
export const confirmRefund = async (req, res) => {
  const { id } = req.params;
  const { adminId, amount, refundType, refundedNow = true, reason } = req.body;

  try {
    const existingRefund = await prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existingRefund) {
      return res.status(404).json({ message: "Refund record not found" });
    }

    const performingAdminId = adminId || req.user?.id || null;
    const isRefundedNow = Boolean(refundedNow === true || refundedNow === "true" || refundedNow === "Yes");
    let refundAmount = amount !== undefined && amount !== null ? parseFloat(amount) : existingRefund.amount;

    if (isRefundedNow && refundAmount <= 0) {
      return res.status(400).json({
        message: "Lacagta la celinayo waa in ay ka badnaataa eber ($0) mar haddii la xaqiijiyay in lacagtii la celiyay."
      });
    }

    if (refundAmount > existingRefund.order.totalAmount) {
      return res.status(400).json({
        message: `Lacagta la celinayo kama badan karto lacagta guud ee order-ka ($${existingRefund.order.totalAmount.toFixed(2)})`
      });
    }

    const activeRefundType = refundAmount >= existingRefund.order.totalAmount ? "FULL" : "PARTIAL";

    if (!isRefundedNow) {
      const updated = await prisma.refund.update({
        where: { id },
        data: {
          amount: refundAmount,
          refundType: activeRefundType,
          reason: reason || existingRefund.reason,
        },
      });
      return res.status(200).json({ message: "Refund updated (remains PENDING)", refund: updated });
    }

    const updatedRefund = await prisma.refund.update({
      where: { id },
      data: {
        status: "REFUNDED",
        amount: refundAmount,
        refundType: activeRefundType,
        confirmedBy: performingAdminId,
        confirmedAt: new Date(),
        reason: reason || existingRefund.reason,
      },
    });

    if (updatedRefund.refundType === "FULL") {
      await restoreStockForFullRefund(updatedRefund.id);
    }

    const finalRefund = await prisma.refund.findUnique({
      where: { id },
      include: { order: { include: { user: true } } },
    });

    return res.status(200).json({
      message: "Refund confirmed successfully",
      refund: finalRefund,
    });
  } catch (error) {
    console.error("Confirm Refund Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/refunds
 * List ONLY confirmed REFUNDED records for the Refunds table page
 */
export const getAllRefunds = async (req, res) => {
  try {
    const refunds = await prisma.refund.findMany({
      where: { status: "REFUNDED" },
      include: { order: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(refunds);
  } catch (error) {
    console.error("Get All Refunds Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/refunds/:id
 * Full CRUD Update for a refund row in Refunds Table
 * Validation Rules:
 * 1. newAmount >= initialRefundedAmount (cannot decrease below already refunded amount)
 * 2. newAmount <= order.totalAmount (cannot exceed order total)
 */
export const updateRefund = async (req, res) => {
  const { id } = req.params;
  const { amount, refundType, reason } = req.body;

  try {
    const existingRefund = await prisma.refund.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!existingRefund) {
      return res.status(404).json({ message: "Refund record not found" });
    }

    let activeRefundType = existingRefund.refundType;
    if (amount !== undefined && amount !== null) {
      const newAmount = parseFloat(amount);
      const minAllowed = existingRefund.amount; // initial/existing refunded amount
      const maxAllowed = existingRefund.order.totalAmount; // order total amount

      if (newAmount <= 0) {
        return res.status(400).json({
          message: "Lacagta la celinayo waa in ay ka badnaataa eber ($0).",
        });
      }

      if (newAmount < minAllowed) {
        return res.status(400).json({
          message: `Lacagta la celinayo kama yaraan karto lacagtii hore loo celiyay ($${minAllowed.toFixed(2)})`,
        });
      }

      if (newAmount > maxAllowed) {
        return res.status(400).json({
          message: `Lacagta la celinayo kama badan karto lacagta guud ee order-ka ($${maxAllowed.toFixed(2)})`,
        });
      }
      activeRefundType = newAmount >= maxAllowed ? "FULL" : "PARTIAL";
    }

    const updatedRefund = await prisma.refund.update({
      where: { id },
      data: {
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        refundType: activeRefundType,
        ...(reason !== undefined && { reason }),
      },
      include: { order: { include: { user: true } } },
    });

    // If updated to FULL and stock was not yet restored
    if (updatedRefund.refundType === "FULL" && !updatedRefund.stockRestored) {
      await restoreStockForFullRefund(updatedRefund.id);
    }

    return res.status(200).json({
      message: "Refund record updated successfully",
      refund: updatedRefund,
    });
  } catch (error) {
    console.error("Update Refund Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/refunds/:id
 * Full CRUD Delete for a refund row
 */
export const deleteRefund = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.refund.delete({
      where: { id },
    });
    return res.status(200).json({ message: "Refund record deleted successfully" });
  } catch (error) {
    console.error("Delete Refund Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/finance/summary
 * Returns { grossRevenue, totalRefunded, netRevenue }
 */
export const getFinanceSummary = async (req, res) => {
  try {
    const gross = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: { in: ["DEPOSIT_PAID", "FULLY_PAID"] } },
    });

    const refunded = await prisma.refund.aggregate({
      _sum: { amount: true },
      where: { status: "REFUNDED" },
    });

    const grossRevenue = gross._sum.totalAmount ?? 0;
    const totalRefunded = refunded._sum.amount ?? 0;
    const netRevenue = grossRevenue - totalRefunded;

    return res.status(200).json({
      grossRevenue,
      totalRefunded,
      netRevenue,
    });
  } catch (error) {
    console.error("Get Finance Summary Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
