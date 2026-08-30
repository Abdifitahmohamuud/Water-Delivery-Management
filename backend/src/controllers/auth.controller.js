import prisma from "../lib/prisma.js";
import { sendOtpEmail, sendForgotPasswordEmail } from "../lib/sendEmails.js";
import {
  hashPassword,
  verifyPassword,
  generateOTP,
  hashOTP,
  verifyOTPHash,
  generateToken,
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateFullName,
  getOTPExpirationTime,
  isOTPExpired,
} from "../lib/auth.utils.js";

// ===================== CUSTOMER REGISTRATION =====================

export const registerCustomer = async (req, res) => {
  try {
    const { email, phone, fullName, password, confirmPassword } = req.body;

    // Validation
    if (!email || !phone || !fullName || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!validateFullName(fullName)) {
      return res.status(400).json({ message: "Invalid full name" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhone }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already registered" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with PENDING_VERIFICATION status
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        fullName: fullName.trim(),
        password: hashedPassword,
        role: "CUSTOMER",
        accountStatus: "PENDING_VERIFICATION",
        customer: {
          create: {},
        },
      },
    });

    // Generate OTP
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const otpExpiration = getOTPExpirationTime(10); // 10 minutes

    await prisma.oTP.create({
      data: {
        userId: user.id,
        type: "REGISTRATION",
        code: otpCode,
        codeHash: otpHash,
        expiresAt: otpExpiration,
      },
    });

    // Send OTP email
    await sendOtpEmail(cleanEmail, otpCode);

    res.status(201).json({
      message: "Registration successful. OTP sent to your email.",
      email: cleanEmail,
      userId: user.id,
    });
  } catch (error) {
    console.error("registerCustomer error:", error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
};

// ===================== OTP VERIFICATION =====================

export const verifyRegistrationOTP = async (req, res) => {
  try {
    const { userId, email, otp: rawOtp, otpCode } = req.body;
    const otp = (rawOtp || otpCode || "").toString().trim();

    if ((!userId && !email) || !otp) {
      return res.status(400).json({ message: "User ID/Email and OTP code are required" });
    }

    // Find user by userId or email
    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    if (user.accountStatus === "ACTIVE") {
      return res.json({ message: "Account is already verified", userId: user.id });
    }

    // Find valid OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        type: "REGISTRATION",
        isUsed: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "No active OTP found. Please request a new OTP code." });
    }

    if (isOTPExpired(otpRecord.expiresAt)) {
      return res.status(400).json({ message: "OTP has expired. Please request a new code." });
    }

    if (otpRecord.attemptCount >= 5) {
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP using hash or direct code comparison
    const isValid = verifyOTPHash(otp, otpRecord.codeHash) || (otpRecord.code && otpRecord.code === otp);

    if (!isValid) {
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attemptCount: otpRecord.attemptCount + 1 },
      });
      return res.status(400).json({ message: "Invalid OTP code. Please double check the 6 digits." });
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Activate account
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { accountStatus: "ACTIVE" },
      include: { customer: true, driver: true },
    });

    // Generate token
    const token = generateToken(updatedUser.id, updatedUser.role);

    res.json({
      message: "Account verified successfully!",
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        accountStatus: updatedUser.accountStatus,
        customer: updatedUser.customer,
      },
    });
  } catch (error) {
    console.error("verifyRegistrationOTP error:", error);
    res.status(500).json({ message: "OTP verification failed: " + error.message });
  }
};

// ===================== RESEND OTP =====================

export const resendOTP = async (req, res) => {
  try {
    const { userId, email, otpType = "REGISTRATION" } = req.body;

    if (!userId && !email) {
      return res.status(400).json({ message: "User ID or Email is required" });
    }

    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Invalidate previous OTPs for this type
    await prisma.oTP.updateMany({
      where: {
        userId: user.id,
        type: otpType,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Generate new OTP
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const otpExpiration = getOTPExpirationTime(10);

    await prisma.oTP.create({
      data: {
        userId: user.id,
        type: otpType,
        code: otpCode,
        codeHash: otpHash,
        expiresAt: otpExpiration,
      },
    });

    // Send OTP
    await sendOtpEmail(user.email, otpCode);

    res.json({
      message: "OTP sent successfully",
      email: user.email,
      userId: user.id,
    });
  } catch (error) {
    console.error("resendOTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP: " + error.message });
  }
};

// ===================== LOGIN =====================

export const login = async (req, res) => {
  try {
    const loginId = (req.body.email || req.body.identifier || req.body.phone || "").toString().trim().toLowerCase();
    const password = req.body.password;

    if (!loginId || !password) {
      return res.status(400).json({ message: "Email/Phone and password are required" });
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { phone: loginId },
        ],
      },
      include: {
        customer: true,
        driver: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email/phone or password" });
    }

    // Verify password first
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email/phone or password" });
    }

    // Check account status
    if (user.accountStatus === "PENDING_VERIFICATION") {
      return res.status(403).json({
        message: "Account is pending OTP verification. Please enter the OTP sent to your email.",
        requiresOtp: true,
        userId: user.id,
        email: user.email,
      });
    }

    if (user.accountStatus === "SUSPENDED" || user.accountStatus === "DEACTIVATED") {
      return res.status(403).json({ message: "Account is suspended or deactivated" });
    }

    // Verify password
    const isPasswordValide = await verifyPassword(password, user.password);
    if (!isPasswordValide) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("login error:", error);
    res.status(500).json({ message: "Login failed: " + error.message });
  }
};

// ===================== LOGOUT =====================

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("logout error:", error);
    res.status(500).json({ message: "Logout failed: " + error.message });
  }
};

// ===================== FORGOT PASSWORD =====================

export const forgotPassword = async (req, res) => {
  try {
    const target = (req.body.email || req.body.identifier || req.body.phone || "").toString().trim().toLowerCase();

    if (!target) {
      return res.status(400).json({ message: "Email or Phone is required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: target },
          { phone: target },
        ],
      },
    });

    const cleanEmail = user.email;

    // Generate OTP
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const otpExpiration = getOTPExpirationTime(15); // 15 minutes for password reset

    // Invalidate previous password reset OTPs
    await prisma.oTP.updateMany({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
        isUsed: false,
      },
      data: { isUsed: true },
    });

    // Create new OTP
    await prisma.oTP.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        code: otpCode,
        codeHash: otpHash,
        expiresAt: otpExpiration,
      },
    });

    // Send email
    await sendForgotPasswordEmail(cleanEmail, otpCode);

    res.json({
      message: "If an account with this email exists, a password reset OTP will be sent.",
      email: cleanEmail,
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Failed to reset password: " + error.message });
  }
};

// ===================== RESET PASSWORD =====================

export const resetPassword = async (req, res) => {
  try {
    const { userId, otp, newPassword, confirmPassword } = req.body;

    if (!userId || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Verify OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        type: "PASSWORD_RESET",
        isUsed: false,
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "No valid OTP found" });
    }

    if (isOTPExpired(otpRecord.expiresAt)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (!verifyOTPHash(otp.toString().trim(), otpRecord.codeHash)) {
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attemptCount: otpRecord.attemptCount + 1 },
      });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark OTP as used
    await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      prisma.oTP.update({
        where: { id: otpRecord.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
    ]);

    // Invalidate all sessions for security
    await prisma.session.deleteMany({
      where: { userId },
    });

    res.json({
      message: "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Password reset failed: " + error.message });
  }
};

// ===================== CHANGE PASSWORD =====================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions except current for security
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      await prisma.session.deleteMany({
        where: {
          userId,
          NOT: { token },
        },
      });
    } else {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    res.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ message: "Password change failed: " + error.message });
  }
};

// ===================== GET PROFILE =====================

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            savedAddresses: true,
          },
        },
        driver: true,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ message: "Failed to get profile: " + error.message });
  }
};

// ===================== UPDATE PROFILE =====================

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { fullName, alternatePhone, alternateEmail } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    if (fullName !== undefined) {
      if (!validateFullName(fullName)) {
        return res.status(400).json({ message: "Invalid full name" });
      }
      updateData.fullName = fullName.trim();
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        customer: {
          include: {
            savedAddresses: true,
          },
        },
        driver: true,
      },
      omit: {
        password: true,
      },
    });

    // Update customer specific fields if customer
    if (user.role === "CUSTOMER" && user.customer) {
      const customerData = {};

      if (alternatePhone !== undefined) {
        if (alternatePhone && !validatePhoneNumber(alternatePhone)) {
          return res.status(400).json({ message: "Invalid phone number" });
        }
        customerData.alternatePhone = alternatePhone || null;
      }

      if (alternateEmail !== undefined) {
        if (alternateEmail && !validateEmail(alternateEmail)) {
          return res.status(400).json({ message: "Invalid email" });
        }
        customerData.alternateEmail = alternateEmail || null;
      }

      if (Object.keys(customerData).length > 0) {
        await prisma.customer.update({
          where: { userId },
          data: customerData,
        });
      }
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ message: "Failed to update profile: " + error.message });
  }
};

// ===================== ADMIN CREATE DRIVER =====================

export const createDriver = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId || req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can create drivers" });
    }

    const {
      email,
      phone,
      fullName,
      password,
      licenseNumber,
      licenseExpiry,
      vehicleNumber,
      vehicleType,
      vehicleColor,
    } = req.body;

    // Validation
    if (!email || !phone || !fullName || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (!validateFullName(fullName)) {
      return res.status(400).json({ message: "Invalid full name" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { phone: cleanPhone }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create driver user
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        phone: cleanPhone,
        fullName: fullName.trim(),
        password: hashedPassword,
        role: "DRIVER",
        accountStatus: "ACTIVE",
        driver: {
          create: {
            licenseNumber: licenseNumber || null,
            licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
            vehicleNumber: vehicleNumber || null,
            vehicleType: vehicleType || null,
            vehicleColor: vehicleColor || null,
            availabilityStatus: "AVAILABLE",
          },
        },
      },
      include: {
        driver: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        actor: adminId,
        action: "DRIVER_ACTIVATED",
        targetType: "Driver",
        targetId: user.driver.id,
        newValue: {
          email: user.email,
          phone: user.phone,
          fullName: user.fullName,
        },
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: "Driver created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("createDriver error:", error);
    res.status(500).json({ message: "Failed to create driver: " + error.message });
  }
};


