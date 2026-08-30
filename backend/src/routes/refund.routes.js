import express from "express";
import { getAllRefunds, confirmRefund, updateRefund, deleteRefund } from "../controllers/refund.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getAllRefunds);
router.patch("/:id/confirm", protect, adminOnly, confirmRefund);
router.put("/:id", protect, adminOnly, updateRefund);
router.delete("/:id", protect, adminOnly, deleteRefund);

export default router;
