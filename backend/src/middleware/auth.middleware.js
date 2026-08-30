import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../lib/auth.utils.js";

// ==================== AUTHENTICATION MIDDLEWARE ====================

export const authenticate = async (req, res, next) => {
  try {
    let token;

    // Try to get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    // Fallback to cookies
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No token provided. Please login first." });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Check session
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    // Get user with their role-specific data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customer: true,
        driver: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check account status
    if (user.accountStatus === "PENDING_VERIFICATION") {
      return res.status(403).json({ message: "Account not verified" });
    }

    if (user.accountStatus === "SUSPENDED") {
      return res.status(403).json({ message: "Account is suspended" });
    }

    if (user.accountStatus === "DEACTIVATED") {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Attach user to request (without password)
    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role,
      accountStatus: user.accountStatus,
      profilePhotoUrl: user.profilePhotoUrl,
      customer: user.customer,
      driver: user.driver,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// ==================== ROLE-BASED AUTHORIZATION ====================

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }

    next();
  };
};

// ==================== CUSTOMER ONLY MIDDLEWARE ====================

export const customerOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "CUSTOMER") {
    return res.status(403).json({ message: "Only customers can access this resource" });
  }

  if (!req.user.customer) {
    return res.status(403).json({ message: "Customer profile not found" });
  }

  next();
};

// ==================== DRIVER ONLY MIDDLEWARE ====================

export const driverOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "DRIVER") {
    return res.status(403).json({ message: "Only drivers can access this resource" });
  }

  if (!req.user.driver) {
    return res.status(403).json({ message: "Driver profile not found" });
  }

  next();
};

// ==================== ADMIN ONLY MIDDLEWARE ====================

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can access this resource" });
  }

  next();
};

export const protect = authenticate;

