import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const { login, forgotPassword, resetPassword, verifyOtp, resendOtp, isLoggingIn, isVerifyingOtp } = useAuthStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Pending OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [unverifiedUserId, setUnverifiedUserId] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotStep, setForgotStep] = useState(1); // 1: Identifier, 2: OTP & New Password
  const [resetUserId, setResetUserId] = useState("");
  const [resetOtpCode, setResetOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ identifier, password });
      const role = res?.user?.role || res?.role;

      if (role === "ADMIN") {
        navigate("/admin");
      } else if (role === "DRIVER") {
        navigate("/driver");
      } else {
        navigate("/");
      }
    } catch (error) {
      if (error?.response?.data?.requiresOtp && error?.response?.data?.userId) {
        setUnverifiedUserId(error.response.data.userId);
        setShowOtpModal(true);
      }
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      return toast.error("Please enter the 6-digit OTP code");
    }

    try {
      const res = await verifyOtp(unverifiedUserId, otpCode);
      setShowOtpModal(false);
      const role = res?.user?.role || res?.role;
      if (role === "ADMIN") navigate("/admin");
      else if (role === "DRIVER") navigate("/driver");
      else navigate("/");
    } catch (error) {
      // Error handled in store
    }
  };

  const handleResendUnverifiedOtp = async () => {
    if (!unverifiedUserId) return;
    try {
      await resendOtp(unverifiedUserId, "REGISTRATION");
    } catch (error) {
      // Error handled in store
    }
  };

  const handleForgotStep1 = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier) return toast.error("Please enter your email or phone");

    setSubmittingReset(true);
    try {
      const res = await forgotPassword(forgotIdentifier);
      if (res?.userId) {
        setResetUserId(res.userId);
      }
      setForgotStep(2);
    } catch (error) {
      // toast shown in store
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleForgotStep2 = async (e) => {
    e.preventDefault();
    if (!resetOtpCode || resetOtpCode.length !== 6) {
      return toast.error("Please enter the 6-digit OTP code");
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error("Passwords do not match");
    }

    setSubmittingReset(true);
    try {
      await resetPassword(resetUserId, resetOtpCode, newPassword);
      setShowForgotModal(false);
      setForgotStep(1);
    } catch (error) {
      // toast shown in store
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-sans">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-600 text-white font-bold text-2xl mb-2">
            💧
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Water System Login</h2>
          <p className="text-xs text-slate-500">Sign in to your Customer, Driver, or Admin portal</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Email or Phone Number *
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="email@example.com or 061xxxxxxx"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold uppercase text-slate-500">Password *</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-bold text-cyan-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-cyan-600/20"
          >
            {isLoggingIn ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have a water account yet?{" "}
          <Link to="/register" className="font-bold text-cyan-600 hover:underline">
            Register Here
          </Link>
        </p>
      </div>

      {/* Unverified OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full space-y-6 text-center shadow-2xl">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 font-bold text-2xl">
              🔑
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Verify Account OTP</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your account is pending verification. Please enter the 6-digit OTP code sent to your email.
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
                {isVerifyingOtp ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>

            <button
              onClick={handleResendUnverifiedOtp}
              className="text-xs font-bold text-cyan-600 hover:underline"
            >
              Resend OTP Code
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h3>
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotStep1} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Enter your registered Email or Phone number to receive a password reset OTP.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email or Phone</label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                    placeholder="email@example.com or 061xxxxxxx"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
                >
                  {submittingReset ? "Sending OTP..." : "Send Reset OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotStep2} className="space-y-4">
                <p className="text-xs text-slate-500">
                  Enter the 6-digit OTP code sent to your email along with your new password.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={resetOtpCode}
                    onChange={(e) => setResetOtpCode(e.target.value)}
                    className="w-full text-center text-xl tracking-[0.3em] font-mono font-bold p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="123456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingReset}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
                >
                  {submittingReset ? "Resetting..." : "Confirm New Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
