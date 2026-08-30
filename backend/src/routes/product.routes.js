import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from "../controllers/product.controller.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";
import { uploadSingleImage } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public / Customer routes
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin routes
router.post("/upload-image", authenticate, adminOnly, uploadSingleImage, uploadProductImage);
router.post("/", authenticate, adminOnly, createProduct);
router.put("/:id", authenticate, adminOnly, updateProduct);
router.delete("/:id", authenticate, adminOnly, deleteProduct);

export default router;
