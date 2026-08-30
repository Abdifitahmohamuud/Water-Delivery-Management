import prisma from "../lib/prisma.js";

// ===================== GET NOTIFICATIONS =====================

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit, 10),
      }),
    ]);

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ message: "Failed to get notifications: " + error.message });
  }
};

export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user?.id;

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error("getUnreadNotificationsCount error:", error);
    res.status(500).json({ message: "Failed to get unread count: " + error.message });
  }
};

// ===================== MARK AS READ =====================

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({
      message: "Notification marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error("markAsRead error:", error);
    res.status(500).json({ message: "Failed to mark as read: " + error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("markAllAsRead error:", error);
    res.status(500).json({ message: "Failed to mark all as read: " + error.message });
  }
};

// ===================== DELETE NOTIFICATION =====================

export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Verify ownership
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("deleteNotification error:", error);
    res.status(500).json({ message: "Failed to delete notification: " + error.message });
  }
};

// Legacy aliases for backward compatibility
export const getMyNotifications = getNotifications;
export const markNotificationRead = markAsRead;
export const markAllNotificationsRead = markAllAsRead;

