import express from "express";
import {
  registerCustomer,
  verifyRegistrationOTP,
  resendOTP,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  createDriver,
} from "../controllers/auth.controller.js";
import {
  authenticate,
  authorize,
  adminOnly,
  customerOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ===================== PUBLIC ROUTES =====================

// Customer Registration & OTP
router.post("/register-customer", registerCustomer);
router.post("/verify-otp", verifyRegistrationOTP);
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", login);

// Password Recovery
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ===================== PROTECTED ROUTES =====================

// Logout
router.post("/logout", authenticate, logout);

// Profile Management
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);

// Change Password
router.post("/change-password", authenticate, changePassword);

// ===================== ADMIN ROUTES =====================

// Create Driver
router.post("/admin/create-driver", authenticate, adminOnly, createDriver);

export default router;

