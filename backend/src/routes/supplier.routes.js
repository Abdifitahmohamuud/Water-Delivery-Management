import express from "express";
import { protect, supplierOnly } from "../middleware/auth.middleware.js";
import {
  getSupplierDashboard,
  getSupplierOrders,
  getSupplierProducts,
  getSupplierTransactions,
  updateOrderStatus,
  cancelOrderWithRefund,
  resolveComplaint,
  deleteOrder,
  getPublicSuppliers,
  getPublicSupplierById,
} from "../controllers/supplier.controller.js";

const router = express.Router();

// Public routes for browsing suppliers
router.get("/public", getPublicSuppliers);
router.get("/public/:id", getPublicSupplierById);

// Protected Supplier routes
router.get("/dashboard", protect, supplierOnly, getSupplierDashboard);
router.get("/orders", protect, supplierOnly, getSupplierOrders);
router.get("/products", protect, supplierOnly, getSupplierProducts);
router.get("/transactions", protect, supplierOnly, getSupplierTransactions);

router.put(
  "/orders/:id/status",
  protect,
  supplierOnly,
  updateOrderStatus
);
router.post("/orders/:id/cancel", protect, supplierOnly, cancelOrderWithRefund);

router.put("/orders/:id/resolve", protect, supplierOnly, resolveComplaint);
router.delete("/orders/:id", protect, supplierOnly, deleteOrder);

export default router;
