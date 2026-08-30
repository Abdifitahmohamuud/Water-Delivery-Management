import express from "express";
import {
  getFinanceSummary,
  getCustomerBalances,
  settleCustomerDebt,
  getPaymentTransactions,
} from "../controllers/finance.controller.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);
router.use(adminOnly);

router.get("/summary", getFinanceSummary);
router.get("/customer-balances", getCustomerBalances);
router.post("/settle", settleCustomerDebt);
router.get("/transactions", getPaymentTransactions);

export default router;
