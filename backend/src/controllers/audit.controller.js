import prisma from "../lib/prisma.js";

// GET /api/audit (Admin only)
export const getAuditLogs = async (req, res) => {
  try {
    const { action, targetType, page = 1, limit = 20 } = req.query;

    const whereClause = {};
    if (action) whereClause.action = action;
    if (targetType) whereClause.targetType = targetType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          actorUser: {
            select: { fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit, 10),
      }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAuditLogs error:", error);
    res.status(500).json({ message: "Failed to fetch audit logs: " + error.message });
  }
};
