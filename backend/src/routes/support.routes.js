import express from "express";
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicketStatus,
} from "../controllers/support.controller.js";
import { authenticate, customerOnly, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Customer endpoints
router.post("/tickets", customerOnly, createTicket);
router.get("/my-tickets", customerOnly, getMyTickets);

// Admin endpoints
router.get("/admin/tickets", adminOnly, getAllTickets);
router.put("/admin/tickets/:ticketId", adminOnly, updateTicketStatus);

export default router;
