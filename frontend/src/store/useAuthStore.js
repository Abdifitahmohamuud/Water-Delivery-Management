import { create } from "zustand";
import api from "../lib/api";
import toast from "react-hot-toast";

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  isLoggingIn: false,
  isRegistering: false,
  isVerifyingOtp: false,

  checkAuth: async () => {
    try {
      const { data } = await api.get("/auth/profile");
      set({ user: data, loading: false });
      return data;
    } catch (error) {
      set({ user: null, loading: false });
      return null;
    }
  },

  login: async (credentials) => {
    set({ isLoggingIn: true });
    try {
      const { data } = await api.post("/auth/login", credentials);
      const { token, user } = data;
      set({ user: user || data, isLoggingIn: false });
      if (token) {
        localStorage.setItem("authToken", token);
      }
      toast.success("Login successful!");
      return data;
    } catch (error) {
      set({ isLoggingIn: false });
      const msg = error?.response?.data?.message || "Login failed";
      toast.error(msg);
      throw error;
    }
  },

  registerCustomer: async (userData) => {
    set({ isRegistering: true });
    try {
      const { data } = await api.post("/auth/register-customer", userData);
      set({ isRegistering: false });
      toast.success(data.message || "Registration successful. Please verify OTP.");
      return data;
    } catch (error) {
      set({ isRegistering: false });
      const msg = error?.response?.data?.message || "Registration failed";
      toast.error(msg);
      throw error;
    }
  },

  verifyOtp: async (userId, otpCode) => {
    set({ isVerifyingOtp: true });
    try {
      const { data } = await api.post("/auth/verify-otp", { userId, otpCode });
      const { token, user } = data;
      set({ user: user || data, isVerifyingOtp: false });
      if (token) {
        localStorage.setItem("authToken", token);
      }
      toast.success("Account verified successfully!");
      return data;
    } catch (error) {
      set({ isVerifyingOtp: false });
      const msg = error?.response?.data?.message || "OTP Verification failed";
      toast.error(msg);
      throw error;
    }
  },

  resendOtp: async (userId, type = "REGISTRATION") => {
    try {
      const { data } = await api.post("/auth/resend-otp", { userId, type });
      toast.success("OTP resent successfully!");
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to resend OTP";
      toast.error(msg);
      throw error;
    }
  },

  forgotPassword: async (identifier) => {
    try {
      const { data } = await api.post("/auth/forgot-password", { identifier });
      toast.success(data.message || "Password reset OTP sent");
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Forgot password request failed";
      toast.error(msg);
      throw error;
    }
  },

  resetPassword: async (userId, otpCode, newPassword, confirmPassword) => {
    try {
      const { data } = await api.post("/auth/reset-password", {
        userId,
        otpCode,
        newPassword,
        confirmPassword,
      });
      toast.success("Password reset successfully. Please login with your new password.");
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Password reset failed";
      toast.error(msg);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const { data } = await api.put("/auth/profile", profileData);
      set({ user: data.user || data });
      toast.success("Profile updated successfully!");
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Profile update failed";
      toast.error(msg);
      throw error;
    }
  },

  changePassword: async (passwords) => {
    try {
      const { data } = await api.post("/auth/change-password", passwords);
      toast.success("Password changed successfully!");
      return data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Change password failed";
      toast.error(msg);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore
    } finally {
      set({ user: null });
      localStorage.removeItem("authToken");
      toast.success("Logged out successfully");
    }
  },
}));

export default useAuthStore;
