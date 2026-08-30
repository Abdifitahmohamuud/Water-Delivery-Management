import prisma from "../lib/prisma.js";

const getSupplierOrder = async (orderId, supplierId) => {
  return await prisma.order.findFirst({
    where: {
      id: orderId,
      items: {
        some: {
          product: {
            supplierId,
          },
        },
      },
    },
    include: {
      refund: true,
      payments: true,
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const resolveComplaint = async (req, res) => {
  const { resolution } = req.body;

  try {
    const order = await getSupplierOrder(req.params.id, req.user.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to your products.",
      });
    }

    const isRefund =
      resolution === "REFUND" || resolution === "REFUNDED";

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        complaintStatus: "RESOLVED",
        status: isRefund ? "RETURNED" : order.status,
      },
    });

    await prisma.dispute.updateMany({
      where: {
        orderId: order.id,
        status: {
          in: ["OPEN", "IN_REVIEW"],
        },
      },
      data: {
        status: "RESOLVED",
        resolutionNote: resolution,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
    });

    if (isRefund) {
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          type: "REFUND",
          amount: order.totalAmount,
          description: `Refund for Order #${order.id.slice(0, 8)}`,
          status: "COMPLETED",
        },
      });
    }

    res.json(updatedOrder);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {

    const order = await getSupplierOrder(
      req.params.id,
      req.user.id
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found or not yours.",
      });
    }

    await prisma.order.delete({
      where: {
        id: order.id,
      },
    });

    res.json({
      message: "Order deleted successfully.",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
const restoreStockForFullRefund = async (refundId) => {

  const refund = await prisma.refund.findUnique({
    where: {
      id: refundId,
    },
    include: {
      order: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!refund) return;

  for (const item of refund.order.items) {

    const product = await prisma.product.findUnique({
      where: {
        id: item.productId,
      },
    });

    if (!product) continue;

    await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        stockQuantity: {
          increment: item.quantity,
        },
      },
    });

  }

};

const ownProductFilter = (supplierId) => ({
  items: {
    some: {
      product: {
        supplierId,
      },
    },
  },
});

export const getSupplierDashboard = async (req, res) => {
  try {
    const [totalProducts, lowStockProducts, totalOrders, pendingOrders] = await Promise.all([
      prisma.product.count({ where: { supplierId: req.user.id } }),
      prisma.product.count({
        where: {
          supplierId: req.user.id,
          OR: [{ stockQuantity: { lte: 10 } }, { stock: { lte: 10 } }],
        },
      }),
      prisma.order.count({ where: ownProductFilter(req.user.id) }),
      prisma.order.count({
        where: {
          ...ownProductFilter(req.user.id),
          status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] },
        },
      }),
    ]);

    const orders = await prisma.order.findMany({
      where: ownProductFilter(req.user.id),
      select: { id: true, totalAmount: true, createdAt: true },
    });
    const orderIds = orders.map((order) => order.id);
    const transactions = orderIds.length
      ? await prisma.transaction.findMany({ where: { orderId: { in: orderIds } }, orderBy: { createdAt: "desc" } })
      : [];
    const revenue = transactions.filter((transaction) => transaction.type === "PAYMENT" && transaction.status === "COMPLETED").reduce((sum, transaction) => sum + transaction.amount, 0);
    const refunds = transactions.filter((transaction) => transaction.type === "REFUND" && transaction.status === "COMPLETED").reduce((sum, transaction) => sum + transaction.amount, 0);
    const monthlyRevenue = transactions.filter((transaction) => transaction.type === "PAYMENT" && transaction.status === "COMPLETED").reduce((months, transaction) => {
      const month = new Date(transaction.createdAt).toLocaleDateString(undefined, { month: "short" });
      months[month] = (months[month] || 0) + transaction.amount;
      return months;
    }, {});

    res.json({
      totalProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      revenue,
      refunds,
      netRevenue: revenue - refunds,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, value]) => ({ month, revenue: value })),
      transactions: transactions.slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierTransactions = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ where: ownProductFilter(req.user.id), select: { id: true } });
    const transactions = orders.length
      ? await prisma.transaction.findMany({ where: { orderId: { in: orders.map(({ id }) => id) } }, orderBy: { createdAt: "desc" } })
      : [];
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSupplierOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: ownProductFilter(req.user.id),
      orderBy: { createdAt: "desc" },
      include: {
        refund: true,
        payments: true,
        user: { select: { name: true, email: true, phoneNumber: true, deliveryAddress: true } },
        items: { include: { product: true } },
      },
    });

    const transactions = orders.length
      ? await prisma.transaction.findMany({
        where: { orderId: { in: orders.map(({ id }) => id) } },
        orderBy: { createdAt: "desc" },
      })
      : [];

    res.json(orders.map((order) => ({
      ...order,
      transactions: transactions.filter((transaction) => transaction.orderId === order.id),
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//update oder status

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const supplierOrder = await getSupplierOrder(req.params.id, req.user.id);
    if (!supplierOrder) {
      return res.status(404).json({ message: "Order not found or not assigned to your products." });
    }

    const existingRefund = await prisma.refund.findUnique({
      where: { orderId: req.params.id },
    });

    if (existingRefund?.status === "REFUNDED") {
      return res.status(400).json({ message: "Dalabkaan lacagtiisa waa la celiyay (Refunded), loomana ogola in wax laga badalo." });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(order.id).emit("statusUpdate", { status });
    }



    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const cancelOrderWithRefund = async (req, res) => {
  const { id } = req.params;
  const { reason, refundedNow, amount, refundType = "FULL", adminId } = req.body;

  if (!reason || reason.trim() === "") {
    return res.status(400).json({ message: "Reason for cancellation is required" });
  }

  try {
    const order = await getSupplierOrder(id, req.user.id);

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
export const getSupplierProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { supplierId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.user.findMany({
      where: {
        role: "SUPPLIER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        supplierBusinessName: true,
        profilePhotoUrl: true,
        deliveryAddress: true,
        createdAt: true,
        supplierProducts: {
          select: { id: true, name: true, price: true, images: true, category: true }
        },
        supplierReviews: {
          where: { isApproved: true },
          select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } }
        }
      }
    });

    const enriched = suppliers.map((supplier) => {
      const reviews = supplier.supplierReviews || [];
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
      return {
        ...supplier,
        avgRating: parseFloat(avgRating),
        reviewCount: reviews.length,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error.message });
  }
};

export const getPublicSupplierById = async (req, res) => {
  try {
    const supplier = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        role: "SUPPLIER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        businessName: true,
        supplierBusinessName: true,
        profilePhotoUrl: true,
        deliveryAddress: true,
        createdAt: true,
        supplierProducts: {
          select: { id: true, name: true, price: true, images: true, category: true, description: true }
        },
        supplierReviews: {
          where: { isApproved: true },
          select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    const reviews = supplier.supplierReviews || [];
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    res.json({
      ...supplier,
      avgRating: parseFloat(avgRating),
      reviewCount: reviews.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

