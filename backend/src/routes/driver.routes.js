import express from "express";
import {
  getAssignedOrders,
  getOrderDetail,
  acceptOrder,
  rejectOrder,
  startDelivery,
  completeDelivery,
  getAvailability,
  setAvailability,
  getCompletedDeliveries,
  getDriverDashboard,
} from "../controllers/driver.controller.js";
import { authenticate, driverOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication
router.use(authenticate);
router.use(driverOnly);

// ===================== DASHBOARD =====================
router.get("/dashboard", getDriverDashboard);

// ===================== ORDERS =====================
router.get("/orders", getAssignedOrders);
router.get("/orders/:orderId", getOrderDetail);

// ===================== ORDER ACTIONS =====================
router.post("/orders/:orderId/accept", acceptOrder);
router.post("/orders/:orderId/reject", rejectOrder);
router.post("/orders/:orderId/start-delivery", startDelivery);
router.post("/orders/:orderId/complete-delivery", completeDelivery);

// ===================== AVAILABILITY =====================
router.get("/availability", getAvailability);
router.put("/availability", setAvailability);
router.post("/availability", setAvailability);

// ===================== DELIVERY HISTORY =====================
router.get("/deliveries/completed", getCompletedDeliveries);

export default router;
