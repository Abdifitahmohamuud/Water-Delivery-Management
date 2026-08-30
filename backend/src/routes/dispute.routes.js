import express from "express";
import {
  getMyDisputes,
  getAllDisputes,
  createDispute,
  updateDispute,
} from "../controllers/dispute.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/mine", protect, getMyDisputes);
router.post("/", protect, createDispute);
router.get("/", protect, adminOnly, getAllDisputes);
router.put("/:id", protect, adminOnly, updateDispute);

export default router;
