import prisma from "../lib/prisma.js";
import { validateQuantity } from "../lib/auth.utils.js";

// ===================== ORDERS =====================

export const getAssignedOrders = async (req, res) => {
  try {
    const driverId = req.user?.id;

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const orders = await prisma.order.findMany({
      where: {
        assignedDriverId: driver.id,
        status: { in: ["ASSIGNED", "ACCEPTED"] },
      },
      include: {
        product: true,
        customer: {
          select: {
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

    res.json(orders);
  } catch (error) {
    console.error("getAssignedOrders error:", error);
    res.status(500).json({ message: "Failed to get assigned orders: " + error.message });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        customer: {
          select: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify driver is assigned
    if (order.assignedDriverId !== driver.id) {
      return res.status(403).json({ message: "Unauthorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    console.error("getOrderDetail error:", error);
    res.status(500).json({ message: "Failed to get order: " + error.message });
  }
};

// ===================== ORDER ACTIONS =====================

export const acceptOrder = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify driver is assigned and order status is correct
    if (order.assignedDriverId !== driver.id) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    if (order.status !== "ASSIGNED") {
      return res.status(400).json({
        message: "Order must be in ASSIGNED status to accept",
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: driverId,
        action: "DRIVER_ACCEPTED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          status: "ACCEPTED",
          driverName: req.user.fullName,
        },
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: updatedOrder.customer.userId,
        type: "DRIVER_ACCEPTED",
        title: "Order Accepted",
        message: `Your order ${updatedOrder.orderNumber} has been accepted by ${req.user.fullName}.`,
      },
    });

    res.json({
      message: "Order accepted successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("acceptOrder error:", error);
    res.status(500).json({ message: "Failed to accept order: " + error.message });
  }
};

export const rejectOrder = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify driver is assigned
    if (order.assignedDriverId !== driver.id) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    if (order.status !== "ASSIGNED") {
      return res.status(400).json({
        message: "Only ASSIGNED orders can be rejected",
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectionReason: reason || null,
        assignedDriverId: null,
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // Update assignment history
    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        driverId: driver.id,
        rejectedAt: new Date(),
        rejectionReason: reason || null,
        status: "REJECTED",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: driverId,
        action: "DRIVER_REJECTED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          status: "REJECTED",
          reason,
        },
      },
    });

    res.json({
      message: "Order rejected successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("rejectOrder error:", error);
    res.status(500).json({ message: "Failed to reject order: " + error.message });
  }
};

export const startDelivery = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify driver and status
    if (order.assignedDriverId !== driver.id) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    if (order.status !== "ACCEPTED") {
      return res.status(400).json({
        message: "Order must be ACCEPTED before starting delivery",
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "IN_DELIVERY",
        startedAt: new Date(),
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // Set driver to BUSY
    await prisma.driver.update({
      where: { id: driver.id },
      data: { availabilityStatus: "BUSY" },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: driverId,
        action: "DELIVERY_STARTED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          status: "IN_DELIVERY",
        },
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: updatedOrder.customer.userId,
        type: "DELIVERY_STARTED",
        title: "Delivery Started",
        message: `Your order ${updatedOrder.orderNumber} is on the way!`,
      },
    });

    res.json({
      message: "Delivery started successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("startDelivery error:", error);
    res.status(500).json({ message: "Failed to start delivery: " + error.message });
  }
};

export const completeDelivery = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { orderId } = req.params;
    const { deliveredQuantity, notes } = req.body;

    if (!orderId || deliveredQuantity === undefined) {
      return res.status(400).json({ message: "Order ID and delivered quantity are required" });
    }

    if (!validateQuantity(deliveredQuantity)) {
      return res.status(400).json({ message: "Invalid delivered quantity" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify driver and status
    if (order.assignedDriverId !== driver.id) {
      return res.status(403).json({ message: "Order not assigned to you" });
    }

    if (order.status !== "IN_DELIVERY") {
      return res.status(400).json({
        message: "Order must be IN_DELIVERY to complete",
      });
    }

    // Update order with delivery info
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "DELIVERED",
        deliveredQuantity: parseInt(deliveredQuantity, 10),
        deliveredAt: new Date(),
        deliveredByDriverId: driver.id,
        deliveryNotes: notes ? notes.trim() : order.deliveryNotes,
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // Set driver back to AVAILABLE
    await prisma.driver.update({
      where: { id: driver.id },
      data: { availabilityStatus: "AVAILABLE" },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: driverId,
        action: "DELIVERY_COMPLETED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          status: "DELIVERED",
          deliveredQuantity,
          requestedQuantity: order.requestedQuantity,
        },
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: updatedOrder.customer.userId,
        type: "ORDER_DELIVERED",
        title: "Order Delivered",
        message: `Your order ${updatedOrder.orderNumber} has been delivered.`,
      },
    });

    res.json({
      message: "Delivery completed successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("completeDelivery error:", error);
    res.status(500).json({ message: "Failed to complete delivery: " + error.message });
  }
};

// ===================== AVAILABILITY =====================

export const getAvailability = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
      select: { availabilityStatus: true, vehicleNumber: true, vehicleType: true },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    res.json({
      availabilityStatus: driver.availabilityStatus || "AVAILABLE",
      vehicleNumber: driver.vehicleNumber,
      vehicleType: driver.vehicleType,
    });
  } catch (error) {
    console.error("getAvailability error:", error);
    res.status(500).json({ message: "Failed to get availability: " + error.message });
  }
};

export const setAvailability = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const status = req.body.status || req.body.availabilityStatus;

    if (!status || !["AVAILABLE", "BUSY", "OFFLINE"].includes(status)) {
      return res.status(400).json({ message: "Invalid availability status. Must be AVAILABLE, BUSY, or OFFLINE" });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const updated = await prisma.driver.update({
      where: { id: driver.id },
      data: { availabilityStatus: status },
    });

    res.json({
      message: "Availability status updated",
      driver: updated,
    });
  } catch (error) {
    console.error("setAvailability error:", error);
    res.status(500).json({ message: "Failed to update availability: " + error.message });
  }
};

// ===================== DELIVERY HISTORY =====================

export const getCompletedDeliveries = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const total = await prisma.order.count({
      where: {
        deliveredByDriverId: driver.id,
        status: "DELIVERED",
      },
    });

    const deliveries = await prisma.order.findMany({
      where: {
        deliveredByDriverId: driver.id,
        status: "DELIVERED",
      },
      include: {
        product: true,
        customer: {
          select: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { deliveredAt: "desc" },
      skip,
      take: parseInt(limit, 10),
    });

    res.json({
      deliveries,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("getCompletedDeliveries error:", error);
    res.status(500).json({ message: "Failed to get deliveries: " + error.message });
  }
};

// ===================== DASHBOARD =====================

export const getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.user?.id;

    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
      include: {
        assignedOrders: {
          where: { status: { in: ["ASSIGNED", "ACCEPTED", "IN_DELIVERY"] } },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver profile not found" });
    }

    // Get stats
    const assignedCount = await prisma.order.count({
      where: { assignedDriverId: driver.id, status: "ASSIGNED" },
    });

    const acceptedCount = await prisma.order.count({
      where: { assignedDriverId: driver.id, status: "ACCEPTED" },
    });

    const inDeliveryCount = await prisma.order.count({
      where: { assignedDriverId: driver.id, status: "IN_DELIVERY" },
    });

    const completedCount = await prisma.order.count({
      where: { deliveredByDriverId: driver.id, status: "DELIVERED" },
    });

    const rejectedCount = await prisma.order.count({
      where: {
        assignmentHistory: {
          some: { driverId: driver.id, status: "REJECTED" },
        },
      },
    });

    // Get active delivery
    const activeDelivery = await prisma.order.findFirst({
      where: {
        assignedDriverId: driver.id,
        status: "IN_DELIVERY",
      },
      include: {
        product: true,
        customer: {
          select: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    res.json({
      user: req.user,
      driver,
      stats: {
        assigned: assignedCount,
        accepted: acceptedCount,
        inDelivery: inDeliveryCount,
        completed: completedCount,
        rejected: rejectedCount,
      },
      activeDelivery,
    });
  } catch (error) {
    console.error("getDriverDashboard error:", error);
    res.status(500).json({ message: "Failed to get dashboard: " + error.message });
  }
};
