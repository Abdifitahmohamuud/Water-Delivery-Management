import express from "express";
import { getSystemSettings, updateSystemSettings } from "../controllers/settings.controller.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getSystemSettings);
router.put("/", authenticate, adminOnly, updateSystemSettings);

export default router;
