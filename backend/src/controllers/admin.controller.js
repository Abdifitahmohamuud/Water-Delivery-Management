import prisma from "../lib/prisma.js";
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  hashOTP,
  verifyOTPHash,
  generateToken,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateFullName,
  getOTPExpirationTime,
  isOTPExpired,
} from "../lib/auth.utils.js";
// ===================== DASHBOARD =====================

export const getAdminDashboard = async (req, res) => {
  try {
    // Order stats
    const orderStats = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });

    const statsMap = {
      pending: 0,
      assigned: 0,
      accepted: 0,
      inDelivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    orderStats.forEach((stat) => {
      if (stat.status === "PENDING") statsMap.pending = stat._count;
      if (stat.status === "ASSIGNED") statsMap.assigned = stat._count;
      if (stat.status === "ACCEPTED") statsMap.accepted = stat._count;
      if (stat.status === "IN_DELIVERY") statsMap.inDelivery = stat._count;
      if (stat.status === "DELIVERED") statsMap.delivered = stat._count;
      if (stat.status === "CANCELLED") statsMap.cancelled = stat._count;
    });

    // Counts
    const [customerCount, driverCount, totalOrders, deliveredOrders] = await Promise.all([
      prisma.customer.count(),
      prisma.driver.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
    ]);

    // Available drivers
    const availableDrivers = await prisma.driver.count({
      where: { availabilityStatus: "AVAILABLE" },
    });

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        product: true,
        customer: true,
        assignedDriver: {
          select: { user: { select: { fullName: true } } },
        },
      },
    });

    res.json({
      stats: statsMap,
      counts: {
        customers: customerCount,
        drivers: driverCount,
        totalOrders,
        deliveredOrders,
        availableDrivers,
      },
      recentOrders,
    });
  } catch (error) {
    console.error("getAdminDashboard error:", error);
    res.status(500).json({ message: "Failed to get dashboard: " + error.message });
  }
};

// ===================== ORDER MANAGEMENT =====================

export const getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { user: { fullName: { contains: search, mode: "insensitive" } } } },
        { customer: { user: { phone: { contains: search } } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          product: true,
          customer: true,
          assignedDriver: { select: { user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit, 10),
      }),
    ]);

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
    console.error("getAllOrders error:", error);
    res.status(500).json({ message: "Failed to get orders: " + error.message });
  }
};

export const assignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body;
    const adminId = req.user?.id;

    if (!orderId || !driverId) {
      return res.status(400).json({ message: "Order ID and Driver ID are required" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!["PENDING", "ASSIGNED", "REJECTED"].includes(order.status)) {
      return res.status(400).json({ message: `Cannot assign driver to order with status ${order.status}` });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Assign driver
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedDriverId: driver.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        product: true,
        customer: true,
        assignedDriver: { select: { user: { select: { fullName: true } } } },
      },
    });

    // Create assignment history
    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        driverId,
        assignedBy: adminId,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: adminId,
        action: "ORDER_ASSIGNED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          driverId,
          driverName: driver.user.fullName,
        },
      },
    });

    // Notify driver
    await prisma.notification.create({
      data: {
        userId: driver.userId,
        type: "NEW_ASSIGNMENT",
        title: "New Order Assignment",
        message: `You have been assigned to order ${updated.orderNumber}.`,
      },
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: updated.customer.userId,
        type: "DRIVER_ASSIGNED",
        title: "Driver Assigned",
        message: `A driver has been assigned to your order ${updated.orderNumber}.`,
      },
    });

    res.json({
      message: "Driver assigned successfully",
      order: updated,
    });
  } catch (error) {
    console.error("assignDriver error:", error);
    res.status(500).json({ message: "Failed to assign driver: " + error.message });
  }
};

export const reassignDriver = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { driverId, reason } = req.body;
    const adminId = req.user?.id;

    if (!orderId || !driverId) {
      return res.status(400).json({ message: "Order ID and new Driver ID are required" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const oldDriverId = order.assignedDriverId;

    // Reassign
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        assignedDriverId: driver.id,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      include: {
        product: true,
        customer: true,
      },
    });

    // Create new assignment history
    await prisma.orderAssignmentHistory.create({
      data: {
        orderId,
        driverId,
        assignedBy: adminId,
        assignedAt: new Date(),
        status: "ASSIGNED",
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: adminId,
        action: "ORDER_REASSIGNED",
        targetType: "Order",
        targetId: orderId,
        orderId,
        newValue: {
          oldDriverId,
          newDriverId: driver.id,
          reason,
        },
      },
    });

    // Notify new driver
    await prisma.notification.create({
      data: {
        userId: driver.userId,
        type: "ORDER_REASSIGNED",
        title: "Order Assigned",
        message: `You have been assigned to order ${updated.orderNumber}.`,
      },
    });

    res.json({
      message: "Driver reassigned successfully",
      order: updated,
    });
  } catch (error) {
    console.error("reassignDriver error:", error);
    res.status(500).json({ message: "Failed to reassign driver: " + error.message });
  }
};

// ===================== PRODUCTS =====================

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.waterProduct.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(products);
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ message: "Failed to get products: " + error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, unit, currentPrice } = req.body;

    if (!name || !unit || currentPrice === undefined) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (currentPrice < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const product = await prisma.waterProduct.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        unit: unit.trim(),
        currentPrice: parseFloat(currentPrice),
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("createProduct error:", error);
    res.status(500).json({ message: "Failed to create product: " + error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, unit, currentPrice, isActive } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (unit !== undefined) updateData.unit = unit.trim();
    
    if (currentPrice !== undefined) {
      if (currentPrice < 0) {
        return res.status(400).json({ message: "Price cannot be negative" });
      }
      // Store price change history
      const currentProduct = await prisma.waterProduct.findUnique({
        where: { id: productId },
      });

      if (currentProduct && currentProduct.currentPrice !== currentPrice) {
        await prisma.productPriceHistory.create({
          data: {
            productId,
            previousPrice: currentProduct.currentPrice,
            newPrice: parseFloat(currentPrice),
          },
        });
      }

      updateData.currentPrice = parseFloat(currentPrice);
    }

    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await prisma.waterProduct.update({
      where: { id: productId },
      data: updateData,
    });

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("updateProduct error:", error);
    res.status(500).json({ message: "Failed to update product: " + error.message });
  }
};

// ===================== DRIVERS =====================

export const getDrivers = async (req, res) => {
  try {
    const { search, availableOnly, page = 1, limit = 50 } = req.query;

    const whereClause = {};

    if (availableOnly === "true") {
      whereClause.availabilityStatus = { in: ["AVAILABLE", "BUSY"] };
    }

    if (search) {
      whereClause.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [total, drivers] = await Promise.all([
      prisma.driver.count({ where: whereClause }),
      prisma.driver.findMany({
        where: whereClause,
        include: { user: true },
        skip,
        take: parseInt(limit, 10),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    res.json({
      drivers,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("getDrivers error:", error);
    res.status(500).json({ message: "Failed to get drivers: " + error.message });
  }
};

export const deactivateDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const adminId = req.user?.id;

    if (!driverId) {
      return res.status(400).json({ message: "Driver ID is required" });
    }

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Deactivate user
    await prisma.user.update({
      where: { id: driver.userId },
      data: { accountStatus: "DEACTIVATED" },
    });

    // Set driver offline
    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: { availabilityStatus: "OFFLINE" },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: adminId,
        action: "DRIVER_DEACTIVATED",
        targetType: "Driver",
        targetId: driverId,
        newValue: { accountStatus: "DEACTIVATED" },
      },
    });

    res.json({
      message: "Driver deactivated successfully",
      driver: updated,
    });
  } catch (error) {
    console.error("deactivateDriver error:", error);
    res.status(500).json({ message: "Failed to deactivate driver: " + error.message });
  }
};

// ===================== REPORTS =====================

export const getReports = async (req, res) => {
  try {
    const totalOrders = await prisma.order.count();
    const deliveredOrders = await prisma.order.count({ where: { status: "DELIVERED" } });
    const cancelledOrders = await prisma.order.count({ where: { status: "CANCELLED" } });

    // Revenue
    const paidOrders = await prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalPrice: true },
    });

    // Requested vs delivered quantity
    const quantityStats = await prisma.order.aggregate({
      where: { status: "DELIVERED" },
      _sum: { requestedQuantity: true, deliveredQuantity: true },
    });

    res.json({
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      revenue: paidOrders._sum.totalPrice || 0,
      quantityStats: {
        totalRequested: quantityStats._sum.requestedQuantity || 0,
        totalDelivered: quantityStats._sum.deliveredQuantity || 0,
      },
    });
  } catch (error) {
    console.error("getReports error:", error);
    res.status(500).json({ message: "Failed to get reports: " + error.message });
  }
};




// ===================== CUSTOMERS FULL CRUD =====================

export const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { phone: { contains: search } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where: whereClause }),
      prisma.customer.findMany({
        where: whereClause,
        include: {
          user: true,
          orders: { select: { id: true } },
        },
        skip,
        take: parseInt(limit, 10),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formatted = customers.map((c) => ({
      id: c.id,
      userId: c.userId,
      user: c.user,
      ordersCount: c.orders.length,
      createdAt: c.createdAt,
    }));

    res.json({
      customers: formatted,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("getCustomers error:", error);
    res.status(500).json({ message: "Failed to get customers: " + error.message });
  }
};

export const createCustomerAdmin = async (req, res) => {
  try {
    const { fullName, email, phone, password, role = "CUSTOMER", vehicleNumber, vehicleType, accountStatus = "ACTIVE" } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "Full Name, Email, Phone, and Password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { phone: cleanPhone }] },
    });

    if (existing) {
      return res.status(409).json({ message: "Email or Phone is already registered" });
    }
    const     hashedPassword = await hashPassword(password.trim());

    const targetRole = ["CUSTOMER", "DRIVER", "ADMIN"].includes(role) ? role : "CUSTOMER";

    const userData = {
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: targetRole,
      accountStatus,
    };

    if (targetRole === "DRIVER") {
      userData.driver = {
        create: {
          vehicleNumber: vehicleNumber || "TRK-001",
          vehicleType: vehicleType || "Water Tanker Truck",
        },
      };
    } else {
      userData.customer = { create: {} };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { customer: true, driver: true },
    });

    res.status(201).json({
      message: `User (${user.role}) account created successfully`,
      user,
    });
  } catch (error) {
    console.error("createCustomerAdmin error:", error);
    res.status(500).json({ message: "Failed to create user: " + error.message });
  }
};

export const updateCustomerAdmin = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fullName, email, phone, password, accountStatus } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const userUpdate = {};
    if (fullName) userUpdate.fullName = fullName.trim();
    if (email) userUpdate.email = email.trim().toLowerCase();
    if (phone) userUpdate.phone = phone.trim();
    if (accountStatus) userUpdate.accountStatus = accountStatus;
    if (password && password.trim()) {
      userUpdate.password = await hashPassword(password.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: customer.userId },
      data: userUpdate,
    });

    res.json({
      message: "Customer updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateCustomerAdmin error:", error);
    res.status(500).json({ message: "Failed to update customer: " + error.message });
  }
};

export const deleteCustomerAdmin = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    await prisma.user.delete({
      where: { id: customer.userId },
    });

    res.json({ message: "Customer account deleted successfully" });
  } catch (error) {
    console.error("deleteCustomerAdmin error:", error);
    res.status(500).json({ message: "Failed to delete customer: " + error.message });
  }
};

// PUT /api/admin/orders/:orderId/quantity (Admin - Edit order requested quantity and auto-recalculate prices)
export const updateOrderQuantityAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { requestedQuantity } = req.body;

    const qty = parseInt(requestedQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: "Valid positive requested quantity is required" });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, customer: { include: { user: true } } },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const unitPrice = order.unitPrice || order.product?.currentPrice || 0;
    const subtotal = unitPrice * qty;
    const deliveryFee = order.deliveryFee || 0;
    const totalPrice = subtotal + deliveryFee;
    const amountPaid = order.amountPaid || 0;
    const balanceDue = Math.max(0, totalPrice - amountPaid);
    const paymentStatus = balanceDue === 0 ? "PAID" : amountPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        requestedQuantity: qty,
        subtotal,
        totalPrice,
        balanceDue,
        paymentStatus,
      },
      include: {
        product: true,
        customer: { select: { id: true, user: { select: { fullName: true, phone: true, email: true } } } },
        assignedDriver: { select: { id: true, user: { select: { fullName: true, phone: true } } } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user.id,
        action: "PRODUCT_UPDATED",
        targetType: "Order",
        targetId: orderId,
        oldValue: { quantity: order.requestedQuantity, totalPrice: order.totalPrice },
        newValue: { quantity: qty, totalPrice },
      },
    });

    res.json({
      message: `Order quantity updated to ${qty} container(s). Total recalculated to $${totalPrice.toFixed(2)}.`,
      order: updated,
    });
  } catch (error) {
    console.error("updateOrderQuantityAdmin error:", error);
    res.status(500).json({ message: "Failed to update order quantity: " + error.message });
  }
};


