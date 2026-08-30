import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const { registerCustomer, verifyOtp, resendOtp, isRegistering, isVerifyingOtp } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // OTP Verification State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const res = await registerCustomer(formData);
      const uid = res?.userId || res?.user?.id;
      if (uid) {
        setRegisteredUserId(uid);
      }
      setShowOtpModal(true);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      return toast.error("Please enter the 6-digit OTP code");
    }

    try {
      await verifyOtp(registeredUserId, otpCode);
      setShowOtpModal(false);
      navigate("/");
    } catch (error) {
      // Error handled in store
    }
  };

  const handleResend = async () => {
    if (!registeredUserId) return;
    try {
      await resendOtp(registeredUserId, "REGISTRATION");
    } catch (error) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white font-bold text-2xl mb-2">
            💧
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Create Water Account</h2>
          <p className="text-xs text-slate-500">Register to order water Jerrycans & containers for delivery</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="Ahmed Mohamed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="061xxxxxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="ahmed@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password *</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-cyan-600/20"
          >
            {isRegistering ? "Registering..." : "Create Account & Send OTP"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-cyan-600 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-2xl">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 font-bold text-2xl">
              ✉️
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Verify Account OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit verification code sent to your email/phone.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-2xl tracking-[0.5em] font-mono font-bold p-3.5 rounded-xl border border-cyan-500 bg-cyan-50/50 dark:bg-slate-800"
              />

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
              >
                {isVerifyingOtp ? "Verifying..." : "Verify & Activate Account"}
              </button>
            </form>

            <button
              onClick={handleResend}
              className="text-xs font-bold text-cyan-600 hover:underline"
            >
              Didn't receive code? Resend OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
