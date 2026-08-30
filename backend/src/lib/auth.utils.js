import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ==================== PASSWORD HASHING ====================

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// ==================== OTP GENERATION ====================

export const generateOTP = () => {
  // Generate 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

export const verifyOTPHash = (otp, hash) => {
  return hashOTP(otp) === hash;
};

// ==================== JWT TOKEN MANAGEMENT ====================

export const generateToken = (userId, role, expiresIn = "30d") => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || "secret",
    { expiresIn }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "secret");
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

// ==================== PHONE NUMBER VALIDATION ====================

export const validatePhoneNumber = (phone) => {
  // Somalia phone numbers typically start with +252, 0, or just the number
  // For simplicity, require at least 7 digits
  const phoneDigits = phone.replace(/\D/g, "");
  return phoneDigits.length >= 7;
};

// ==================== EMAIL VALIDATION ====================

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ==================== PASSWORD VALIDATION ====================

export const validatePassword = (password) => {
  // Password must be at least 6 characters
  return password && password.length >= 6;
};

export const validatePasswordStrength = (password) => {
  // Check for at least one uppercase, one lowercase, one number
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isLongEnough = password.length >= 8;

  return {
    isStrong: hasUpperCase && hasLowerCase && hasNumber && isLongEnough,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    isLongEnough,
  };
};

// ==================== NAME VALIDATION ====================

export const validateFullName = (name) => {
  // Name should have at least 2 characters and contain at least one letter
  return name && name.trim().length >= 2 && /[a-zA-Z]/.test(name);
};

// ==================== OTP EXPIRATION ====================

export const getOTPExpirationTime = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const isOTPExpired = (expiresAt) => {
  return new Date() > expiresAt;
};

// ==================== QUANTITY VALIDATION ====================

export const validateQuantity = (quantity) => {
  const num = parseInt(quantity, 10);
  return !isNaN(num) && num > 0;
};

// ==================== ORDER NUMBER GENERATION ====================

export const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  return `ORD-${year}-${random}`;
};

// ==================== TICKET NUMBER GENERATION ====================

export const generateTicketNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TKT-${timestamp}-${random}`;
};
