import express from "express";
import {
  createReview,
  getProductReviews,
  getSupplierReviews,
  getPendingReviews,
  approveReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.get("/supplier/:supplierId", getSupplierReviews);
router.get("/:productId", getProductReviews); // Legacy fallback

router.post("/", protect, createReview);

// Admin Moderation Routes
router.get("/admin/pending", protect, adminOnly, getPendingReviews);
router.put("/admin/:id/approve", protect, adminOnly, approveReview);
router.delete("/admin/:id", protect, adminOnly, deleteReview);

export default router;
