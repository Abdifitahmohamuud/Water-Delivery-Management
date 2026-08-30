import express from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, adminOnly, getAuditLogs);

export default router;
