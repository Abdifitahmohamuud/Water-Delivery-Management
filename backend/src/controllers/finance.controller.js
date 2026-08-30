import prisma from "../lib/prisma.js";

// GET /api/finance/summary (Admin - Total Receivables, Total Paid, Unpaid Orders Count)
export const getFinanceSummary = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        totalPrice: true,
        amountPaid: true,
        balanceDue: true,
        paymentStatus: true,
        paymentOption: true,
      },
    });

    let totalRevenueExpected = 0;
    let totalCollected = 0;
    let totalOutstandingDebt = 0;
    let unpaidOrdersCount = 0;

    orders.forEach((o) => {
      totalRevenueExpected += o.totalPrice || 0;
      const paid = o.amountPaid !== undefined && o.amountPaid !== null ? o.amountPaid : (o.paymentStatus === "PAID" ? o.totalPrice : 0);
      const debt = o.balanceDue !== undefined && o.balanceDue !== null ? o.balanceDue : (o.paymentStatus === "PAID" ? 0 : o.totalPrice - paid);

      totalCollected += paid;
      totalOutstandingDebt += Math.max(0, debt);

      if (o.paymentStatus !== "PAID") {
        unpaidOrdersCount++;
      }
    });

    res.json({
      totalRevenueExpected,
      totalCollected,
      totalOutstandingDebt,
      unpaidOrdersCount,
      totalOrdersCount: orders.length,
    });
  } catch (error) {
    console.error("getFinanceSummary error:", error);
    res.status(500).json({ message: "Failed to get finance summary: " + error.message });
  }
};

// GET /api/finance/customer-balances (Admin - Receivables per customer)
export const getCustomerBalances = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        user: { select: { fullName: true, phone: true, email: true } },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalPrice: true,
            amountPaid: true,
            balanceDue: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const report = customers.map((c) => {
      let totalOrdered = 0;
      let totalPaid = 0;
      let totalDebt = 0;
      let unpaidCount = 0;

      c.orders.forEach((o) => {
        totalOrdered += o.totalPrice || 0;
        const paid = o.amountPaid !== undefined && o.amountPaid !== null ? o.amountPaid : (o.paymentStatus === "PAID" ? o.totalPrice : 0);
        const debt = o.balanceDue !== undefined && o.balanceDue !== null ? o.balanceDue : (o.paymentStatus === "PAID" ? 0 : o.totalPrice - paid);

        totalPaid += paid;
        totalDebt += Math.max(0, debt);
        if (o.paymentStatus !== "PAID") unpaidCount++;
      });

      return {
        customerId: c.id,
        userId: c.userId,
        customerName: c.user?.fullName || "Customer",
        phone: c.user?.phone,
        email: c.user?.email,
        totalOrdered,
        totalPaid,
        totalDebt,
        unpaidOrdersCount: unpaidCount,
        ordersCount: c.orders.length,
      };
    });

    res.json(report);
  } catch (error) {
    console.error("getCustomerBalances error:", error);
    res.status(500).json({ message: "Failed to get customer balances: " + error.message });
  }
};

// POST /api/finance/settle-payment (Admin - FIFO Debt Settlement)
export const settleCustomerDebt = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { customerId, paymentAmount, paymentMethod = "CASH", notes } = req.body;

    const amount = parseFloat(paymentAmount);
    if (!customerId || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Valid Customer ID and positive payment amount are required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { user: true },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Fetch unpaid/partially paid orders ordered by oldest first (FIFO)
    const unpaidOrders = await prisma.order.findMany({
      where: {
        customerId,
        paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "asc" },
    });

    if (unpaidOrders.length === 0) {
      return res.status(400).json({ message: "This customer has no unpaid orders to settle." });
    }

    let remainingPayment = amount;
    const allocations = [];

    for (const order of unpaidOrders) {
      if (remainingPayment <= 0) break;

      const currentPaid = order.amountPaid || (order.paymentStatus === "PAID" ? order.totalPrice : 0);
      const currentDebt = order.totalPrice - currentPaid;

      if (currentDebt <= 0) continue;

      let allocated = 0;
      let newPaymentStatus = order.paymentStatus;
      let newAmountPaid = currentPaid;
      let newBalanceDue = currentDebt;

      if (remainingPayment >= currentDebt) {
        allocated = currentDebt;
        remainingPayment -= currentDebt;
        newAmountPaid = order.totalPrice;
        newBalanceDue = 0;
        newPaymentStatus = "PAID";
      } else {
        allocated = remainingPayment;
        newAmountPaid = currentPaid + remainingPayment;
        newBalanceDue = order.totalPrice - newAmountPaid;
        remainingPayment = 0;
        newPaymentStatus = "PARTIALLY_PAID";
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newPaymentStatus,
          paymentMethod,
        },
      });

      allocations.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        allocatedAmount: allocated,
        newAmountPaid,
        newBalanceDue,
        newPaymentStatus,
      });
    }

    // Record Payment Transaction
    const transaction = await prisma.paymentTransaction.create({
      data: {
        customerId,
        amount,
        paymentMethod,
        notes,
        allocatedOrders: allocations,
        createdByAdminId: adminId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actor: adminId,
        action: "PAYMENT_CONFIRMED",
        targetType: "PaymentTransaction",
        targetId: transaction.id,
        newValue: { customerName: customer.user?.fullName, amount, allocations },
      },
    });

    res.json({
      message: `Successfully allocated $${amount.toFixed(2)} to ${allocations.length} order(s).`,
      transaction,
      allocations,
      unallocatedAmount: remainingPayment,
    });
  } catch (error) {
    console.error("settleCustomerDebt error:", error);
    res.status(500).json({ message: "Failed to settle payment: " + error.message });
  }
};

// GET /api/finance/transactions (Admin - Payment History Trail)
export const getPaymentTransactions = async (req, res) => {
  try {
    const transactions = await prisma.paymentTransaction.findMany({
      include: {
        customer: {
          select: {
            id: true,
            user: { select: { fullName: true, phone: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error("getPaymentTransactions error:", error);
    res.status(500).json({ message: "Failed to get payment transactions: " + error.message });
  }
};
