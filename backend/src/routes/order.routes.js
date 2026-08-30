import express from "express";
import multer from "multer";
import { uploadToSupabase } from "../lib/upload.js";
import prisma from "../lib/prisma.js";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  getAllOrders,
  updateOrderStatus,
  submitComplaint,
  resolveComplaint,
  deleteOrder,
  getPayments,
  payOrderBalance,
} from "../controllers/order.controller.js";
import { cancelOrderWithRefund } from "../controllers/refund.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", protect, createOrder);
router.get("/myorders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/return", protect, requestReturn);
router.post("/:id/complaint", protect, submitComplaint);
router.post("/:id/pay", protect, payOrderBalance);

router.get("/:id/payments", protect, getPayments);
router.post("/upload-proof", protect, upload.single("proof"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const { orderId, amount, manualType } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(req.user.role === "ADMIN" ? {} : { userId: req.user.id }),
      },
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const fileUrl = await uploadToSupabase(req.file, "payment-proofs");
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId: order.userId,
        type: "FULL",
        method: "MANUAL",
        manualType: manualType === "CARD" ? "CARD" : "CASH",
        amount: Number.isFinite(Number(amount)) ? Number(amount) : order.totalAmount,
        status: "PENDING",
        paymentInfo: { proofUrl: fileUrl },
      },
    });

    res.status(201).json({ fileUrl, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Routes
router.get("/", protect, adminOnly, getAllOrders);
router.post("/:id/cancel", protect, adminOnly, cancelOrderWithRefund);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);
router.put("/:id/resolve", protect, adminOnly, resolveComplaint);
router.delete("/:id", protect, adminOnly, deleteOrder);

export default router;
