import prisma from "../lib/prisma.js";
import { generateOrderNumber, validateQuantity } from "../lib/auth.utils.js";

// ===================== SAVED ADDRESSES =====================

export const getSavedAddresses = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const addresses = await prisma.savedAddress.findMany({
      where: { customerId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.json(addresses);
  } catch (error) {
    console.error("getSavedAddresses error:", error);
    res.status(500).json({ message: "Failed to get addresses: " + error.message });
  }
};

export const createSavedAddress = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { label, address, latitude, longitude, notes, isDefault } = req.body;

    if (!label || !address) {
      return res.status(400).json({ message: "Label and address are required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    // If marking as default, unset other defaults
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const savedAddress = await prisma.savedAddress.create({
      data: {
        customerId: customer.id,
        label: label.trim(),
        address: address.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes: notes ? notes.trim() : null,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      message: "Address saved successfully",
      address: savedAddress,
    });
  } catch (error) {
    console.error("createSavedAddress error:", error);
    res.status(500).json({ message: "Failed to save address: " + error.message });
  }
};

export const updateSavedAddress = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { addressId } = req.params;
    const { label, address, latitude, longitude, notes, isDefault } = req.body;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    // Verify ownership
    const savedAddress = await prisma.savedAddress.findUnique({
      where: { id: addressId },
    });

    if (!savedAddress || savedAddress.customerId !== customer.id) {
      return res.status(403).json({ message: "Unauthorized to update this address" });
    }

    const updateData = {};

    if (label !== undefined) updateData.label = label.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    if (isDefault === true) {
      // Unset other defaults
      await prisma.savedAddress.updateMany({
        where: { customerId: customer.id, isDefault: true },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    } else if (isDefault === false) {
      updateData.isDefault = false;
    }

    const updated = await prisma.savedAddress.update({
      where: { id: addressId },
      data: updateData,
    });

    res.json({
      message: "Address updated successfully",
      address: updated,
    });
  } catch (error) {
    console.error("updateSavedAddress error:", error);
    res.status(500).json({ message: "Failed to update address: " + error.message });
  }
};

export const deleteSavedAddress = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { addressId } = req.params;

    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    // Verify ownership
    const savedAddress = await prisma.savedAddress.findUnique({
      where: { id: addressId },
    });

    if (!savedAddress || savedAddress.customerId !== customer.id) {
      return res.status(403).json({ message: "Unauthorized to delete this address" });
    }

    await prisma.savedAddress.delete({
      where: { id: addressId },
    });

    res.json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("deleteSavedAddress error:", error);
    res.status(500).json({ message: "Failed to delete address: " + error.message });
  }
};

// ===================== ORDERS =====================

export const createOrder = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      productId,
      requestedQuantity,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryNotes,
      phone,
    } = req.body;

    // Validation
    if (!productId || !requestedQuantity || !deliveryAddress || !phone) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!validateQuantity(requestedQuantity)) {
      return res.status(400).json({ message: "Invalid quantity. Must be greater than 0" });
    }

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    // Get product and validate
    const product = await prisma.waterProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isActive) {
      return res.status(400).json({ message: "Product is no longer available" });
    }

    // Calculate order price
    const unitPrice = product.currentPrice;
    const subtotal = unitPrice * requestedQuantity;
    const deliveryFee = 0; // Will be set by admin or from settings
    const totalPrice = subtotal + deliveryFee;

    // Generate order number
    const orderNumber = generateOrderNumber();

    const isPayLater = req.body.paymentOption === "PAY_LATER_MONTHLY";
    const initialPaymentStatus = isPayLater ? "UNPAID" : (req.body.paymentStatus || "UNPAID");
    const amountPaid = initialPaymentStatus === "PAID" ? totalPrice : 0;
    const balanceDue = totalPrice - amountPaid;

    // Create order with price snapshot
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        productId,
        requestedQuantity: parseInt(requestedQuantity, 10),
        unitPrice,
        subtotal,
        deliveryFee,
        totalPrice,
        deliveryAddress: deliveryAddress.trim(),
        deliveryLatitude: deliveryLatitude ? parseFloat(deliveryLatitude) : null,
        deliveryLongitude: deliveryLongitude ? parseFloat(deliveryLongitude) : null,
        deliveryNotes: deliveryNotes ? deliveryNotes.trim() : null,
        status: "PENDING",
        paymentOption: isPayLater ? "PAY_LATER_MONTHLY" : "PAY_NOW",
        paymentStatus: initialPaymentStatus,
        amountPaid,
        balanceDue,
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: customerId,
        action: "ORDER_CREATED",
        targetType: "Order",
        targetId: order.id,
        orderId: order.id,
        newValue: {
          orderNumber: order.orderNumber,
          quantity: order.requestedQuantity,
          totalPrice: order.totalPrice,
        },
      },
    });

    // Create notification for order created
    await prisma.notification.create({
      data: {
        userId: customerId,
        type: "ORDER_CREATED",
        title: "Order Created",
        message: `Your order ${order.orderNumber} has been created successfully.`,
      },
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    res.status(500).json({ message: "Failed to create order: " + error.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const whereClause = { customerId: customer.id };

    // Filter by status if provided
    if (status) {
      if (!["PENDING", "ASSIGNED", "ACCEPTED", "REJECTED", "IN_DELIVERY", "DELIVERED", "CANCELLED"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      whereClause.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Get total count
    const total = await prisma.order.count({
      where: whereClause,
    });

    // Get orders
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        product: true,
        assignedDriver: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit, 10),
    });

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("getCustomerOrders error:", error);
    res.status(500).json({ message: "Failed to get orders: " + error.message });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        customer: true,
        assignedDriver: {
          select: {
            id: true,
            availabilityStatus: true,
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
        deliveredByDriver: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        payments: true,
        assignmentHistory: {
          include: {
            driver: {
              select: {
                user: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify ownership
    if (order.customerId !== customer.id) {
      return res.status(403).json({ message: "Unauthorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("getOrderDetail error:", error);
    res.status(500).json({ message: "Failed to get order: " + error.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify ownership
    if (order.customerId !== customer.id) {
      return res.status(403).json({ message: "Unauthorized to cancel this order" });
    }

    // Check if order can be cancelled (only PENDING orders can be cancelled by customer)
    if (order.status !== "PENDING") {
      return res.status(400).json({
        message: "Only pending orders can be cancelled by customers",
      });
    }

    // Cancel the order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: customerId,
        cancellationReason: reason || null,
      },
      include: {
        product: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: customerId,
        action: "ORDER_CANCELLED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          status: "CANCELLED",
          reason,
        },
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: customerId,
        type: "ORDER_CANCELLED",
        title: "Order Cancelled",
        message: `Your order ${updatedOrder.orderNumber} has been cancelled.`,
      },
    });

    res.json({
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("cancelOrder error:", error);
    res.status(500).json({ message: "Failed to cancel order: " + error.message });
  }
};

// ===================== DASHBOARD =====================

export const getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    // Get active order (status IN_DELIVERY or ACCEPTED)
    const activeOrder = await prisma.order.findFirst({
      where: {
        customerId: customer.id,
        status: { in: ["ACCEPTED", "IN_DELIVERY"] },
      },
      include: {
        product: true,
        assignedDriver: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get order statistics
    const stats = await prisma.order.groupBy({
      by: ["status"],
      where: { customerId: customer.id },
      _count: true,
    });

    const statsMap = {
      pending: 0,
      active: 0,
      delivered: 0,
      cancelled: 0,
    };

    stats.forEach((stat) => {
      if (stat.status === "PENDING") statsMap.pending = stat._count;
      if (["ASSIGNED", "ACCEPTED", "IN_DELIVERY"].includes(stat.status))
        statsMap.active = stat._count;
      if (stat.status === "DELIVERED") statsMap.delivered = stat._count;
      if (stat.status === "CANCELLED") statsMap.cancelled = stat._count;
    });

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      where: { customerId: customer.id },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: customerId,
        isRead: false,
      },
    });

    res.json({
      user: req.user,
      activeOrder,
      stats: statsMap,
      recentOrders,
      unreadNotificationsCount: unreadNotifications,
    });
  } catch (error) {
    console.error("getCustomerDashboard error:", error);
    res.status(500).json({ message: "Failed to get dashboard: " + error.message });
  }
};
