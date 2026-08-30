import prisma from "../lib/prisma.js";

export const getMyDisputes = async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      where: { userId: req.user.id },
      include: {
        order: { select: { id: true, totalAmount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllDisputes = async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      include: {
        order: { select: { id: true, totalAmount: true, status: true } },
        user: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDispute = async (req, res) => {
  const { orderId, type = "OTHER", description, evidenceUrl } = req.body;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not authorized to open a dispute for this order" });
    }

    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        userId: req.user.id,
        type: ["WRONG_DELIVERY", "FAKE_PRODUCT", "OTHER"].includes(type) ? type : "OTHER",
        description,
        evidenceUrl,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { complaintStatus: "PENDING" },
    });

    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDispute = async (req, res) => {
  const { status, resolutionNote } = req.body;

  try {
    const dispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status: ["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"].includes(status) ? status : undefined,
        resolutionNote,
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
    });

    res.json(dispute);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
