import express from "express";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication
router.use(authenticate);

// GET notifications
router.get("/", getNotifications);

// GET unread count
router.get("/unread/count", getUnreadNotificationsCount);

// Mark single notification as read
router.put("/:notificationId/read", markAsRead);

// Mark all notifications as read
router.put("/mark-all/read", markAllAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

export default router;

