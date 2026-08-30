import prisma from "../lib/prisma.js";
import { payNow } from "../lib/waafi.js";

const createNotification = async (userId, type, message) => {
  if (!userId) return null;

  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        channel: "EMAIL",
        message,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Notification create failed:", error.message);
    return null;
  }
};

const notifyAdmins = async (type, message) => {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await Promise.all(admins.map((admin) => createNotification(admin.id, type, message)));
};

const getValidCoupon = async (couponCode, orderTotal) => {
  if (!couponCode) return null;

  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.trim().toUpperCase() },
  });

  if (!coupon || !coupon.isActive) return null;
  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) return null;
  if (coupon.validTo && coupon.validTo < now) return null;
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return null;
  if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) return null;

  return coupon;
};

export const createOrder = async (req, res) => {
  const { items, shippingAddress, totalAmount, paymentMethod, last4Digits, comment, userId, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  const targetUserId = (req.user.role === "ADMIN" && userId) ? userId : req.user.id;
  const baseTotal = parseFloat(totalAmount);
  const coupon = await getValidCoupon(couponCode, baseTotal);
  const discountAmount = coupon
    ? coupon.discountType === "PERCENTAGE"
      ? Math.min(baseTotal, (baseTotal * coupon.value) / 100)
      : Math.min(baseTotal, coupon.value)
    : 0;
  const discountedTotal = Math.max(0, baseTotal - discountAmount);

  try {
    let paymentInfo = null;
    let paymentStatus = "PAID";

    const isMobileMoney = ["EVC Plus", "eDahab", "Premier Wallet", "MWALLET_ACCOUNT"].includes(paymentMethod);
    const isOffline = req.body.isOffline || (req.user.role === "ADMIN" && !isMobileMoney);

    if (isMobileMoney && !isOffline) {
      if (!last4Digits) {
        return res.status(400).json({ message: "Phone number is required for mobile payments" });
      }

      console.log(`Initiating WaafiPay for phone: ${last4Digits}, amount: ${discountedTotal}`);
      const waafiResponse = await payNow(last4Digits, discountedTotal);

      if (!waafiResponse) {
        return res.status(400).json({
          message: "No response from WaafiPay server",
          error: "CONNECTION_FAILED"
        });
      }

      const responseCode = waafiResponse.responseCode;
      const params = waafiResponse.params || {};
      const state = (params.state || "").toUpperCase();

      if (responseCode === "2001" && state === "APPROVED") {
        paymentInfo = waafiResponse;
      } else {
        return res.status(400).json({
          message: waafiResponse.responseMsg || "Payment declined or failed",
          error: "PAYMENT_FAILED",
          waafiResponse: waafiResponse
        });
      }
    }

    const order = await prisma.order.create({
        data: {
          userId: targetUserId,
          shippingAddress,
          couponId: coupon?.id || null,
          totalAmount: discountedTotal,
          discountAmount,
          paymentMethod,
          last4Digits,
          paymentStatus,
          comment,
          items: {
            create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price),
          })),
        },
      },
      include: { items: true },
    });

    if (paymentInfo) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: targetUserId,
          type: "FULL",
          method: "WAAFI",
          amount: discountedTotal,
          phoneNumber: last4Digits,
          status: "APPROVED",
          paymentInfo: paymentInfo,
        }
      });
    }

    await prisma.transaction.create({
      data: {
        orderId: order.id,
        type: "PAYMENT",
        amount: discountedTotal,
        description: `Payment for Order #${order.id.slice(0, 8)}`,
        status: "COMPLETED",
      }
    });

    if (coupon) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    await createNotification(
      targetUserId,
      "ORDER_CREATED",
      `Your order #${order.id.slice(0, 8)} has been created successfully.`
    );

    res.status(201).json(order);
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const payDeposit = async (req, res) => {
  return res.status(400).json({ message: "Deposit payments are disabled. Full payment is required." });
};

export const collectBalance = async (req, res) => {
  return res.status(400).json({ message: "Balance collection is disabled. Full payment is required." });
};

export const getPayments = async (req, res) => {
  const { id } = req.params;
  try {
    const payments = await prisma.payment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await prisma.order.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true } },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is owner or admin
    if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    if (order.status !== "PENDING" && order.status !== "PROCESSING" && order.status !== "DEPOSIT_PAID") {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
    });

    await createNotification(order.userId, "ORDER_CANCELLED", `Your order #${order.id.slice(0, 8)} was cancelled.`);
    await notifyAdmins("ORDER_CANCELLED", `Order #${order.id.slice(0, 8)} was cancelled by the customer.`);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestReturn = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to request return" });
    }

    if (order.status !== "DELIVERED") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: "RETURN_PENDING" },
    });

    const io = req.app.get("io");
    io.to(order.id).emit("statusUpdate", { status: "RETURN_PENDING" });
    await createNotification(order.userId, "RETURN_REQUESTED", `Return requested for order #${order.id.slice(0, 8)}.`);

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Controllers
export const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        payments: true,
        refund: true,
        items: { include: { product: true } },
      },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
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

    await createNotification(
      order.userId,
      "ORDER_STATUS",
      `Your order #${order.id.slice(0, 8)} status changed to ${status}.`
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitComplaint = async (req, res) => {
  const { comment } = req.body;
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { 
        comment,
        complaintStatus: "PENDING"
      },
    });

    await prisma.dispute.create({
      data: {
        orderId: order.id,
        userId: req.user.id,
        type: "OTHER",
        description: comment || "Complaint submitted from order detail",
      },
    });

    await notifyAdmins("DISPUTE_OPENED", `A dispute was opened for order #${order.id.slice(0, 8)}.`);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const payOrderBalance = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to pay for this order" });
    }

    const payAmount = parseFloat(amount || order.totalAmount);

    await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: req.user.id,
        amount: payAmount,
        status: "COMPLETED",
        type: "FULL",
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: paymentMethod || order.paymentMethod,
      },
    });

    await prisma.transaction.create({
      data: {
        orderId: order.id,
        type: "PAYMENT",
        amount: payAmount,
        description: `Payment for Order #${order.id.slice(0, 8)}`,
        status: "COMPLETED",
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const resolveComplaint = async (req, res) => {
  const { resolution } = req.body;
  try {
    const isRefund = resolution === "REFUND" || resolution === "REFUNDED";
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { 
        complaintStatus: "RESOLVED",
        status: isRefund ? "RETURNED" : undefined
      },
    });

    await prisma.dispute.updateMany({
      where: { orderId: order.id, status: { in: ["OPEN", "IN_REVIEW"] } },
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
        }
      });
    }

    await createNotification(
      order.userId,
      "DISPUTE_RESOLVED",
      `Your dispute for order #${order.id.slice(0, 8)} has been resolved.`
    );

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
