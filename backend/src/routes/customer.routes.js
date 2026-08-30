import express from "express";
import {
  getSavedAddresses,
  createSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  createOrder,
  getCustomerOrders,
  getOrderDetail,
  cancelOrder,
  getCustomerDashboard,
} from "../controllers/customer.controller.js";
import { authenticate, customerOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(customerOnly);

// ===================== DASHBOARD =====================
router.get("/dashboard", getCustomerDashboard);

// ===================== SAVED ADDRESSES =====================
router.get("/addresses", getSavedAddresses);
router.post("/addresses", createSavedAddress);
router.put("/addresses/:addressId", updateSavedAddress);
router.delete("/addresses/:addressId", deleteSavedAddress);

// ===================== ORDERS =====================
router.post("/orders", createOrder);
router.get("/orders", getCustomerOrders);
router.get("/orders/:orderId", getOrderDetail);
router.post("/orders/:orderId/cancel", cancelOrder);

export default router;
