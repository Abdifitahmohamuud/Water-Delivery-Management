import prisma from "../lib/prisma.js";

// Helper to generate Ticket Number (TICK-2026-000101)
const generateTicketNumber = async () => {
  const count = await prisma.supportTicket.count();
  const year = new Date().getFullYear();
  const nextNum = (count + 1).toString().padStart(6, "0");
  return `TICK-${year}-${nextNum}`;
};

// Customer: Create ticket
export const createTicket = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { subject, message, orderId } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required" });
    }

    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const ticketNumber = await generateTicketNumber();

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId: customer.id,
        orderId: orderId || null,
        subject: subject.trim(),
        message: message.trim(),
        status: "OPEN",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "SUPPORT_TICKET_CREATED",
          title: "New Support Ticket",
          message: `Ticket ${ticketNumber}: ${subject.trim()}`,
        },
      });
    }

    res.status(201).json({ message: "Support ticket created successfully", ticket });
  } catch (error) {
    console.error("createTicket error:", error);
    res.status(500).json({ message: "Failed to create support ticket: " + error.message });
  }
};

// Customer: Get my tickets
export const getMyTickets = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const customer = await prisma.customer.findUnique({
      where: { userId: customerId },
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(tickets);
  } catch (error) {
    console.error("getMyTickets error:", error);
    res.status(500).json({ message: "Failed to fetch tickets: " + error.message });
  }
};

// Admin: Get all tickets
export const getAllTickets = async (req, res) => {
  try {
    const { status, search } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { customer: { user: { fullName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        customer: {
          include: {
            user: {
              select: { fullName: true, phone: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(tickets);
  } catch (error) {
    console.error("getAllTickets error:", error);
    res.status(500).json({ message: "Failed to fetch all tickets: " + error.message });
  }
};

// Admin: Update ticket status and resolution
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, resolution } = req.body;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Support ticket not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (resolution) {
      updateData.resolution = resolution.trim();
      updateData.resolvedBy = req.user.id;
      updateData.resolvedAt = new Date();
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: ticket.customer.userId,
        type: "SUPPORT_TICKET_UPDATED",
        title: "Support Ticket Updated",
        message: `Your ticket ${ticket.ticketNumber} is now ${updatedTicket.status}`,
      },
    });

    res.json({ message: "Ticket updated successfully", ticket: updatedTicket });
  } catch (error) {
    console.error("updateTicketStatus error:", error);
    res.status(500).json({ message: "Failed to update ticket: " + error.message });
  }
};
