import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [formData, setFormData] = useState({
    companyName: "",
    companyPhone: "",
    companyEmail: "",
    companyAddress: "",
    currency: "USD",
    defaultDeliveryFee: 0,
    otpExpiration: 600,
    maxOtpAttempts: 3,
    allowCustomerCancellation: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data) {
        setFormData({
          companyName: res.data.companyName || "",
          companyPhone: res.data.companyPhone || "",
          companyEmail: res.data.companyEmail || "",
          companyAddress: res.data.companyAddress || "",
          currency: res.data.currency || "USD",
          defaultDeliveryFee: res.data.defaultDeliveryFee || 0,
          otpExpiration: res.data.otpExpiration || 600,
          maxOtpAttempts: res.data.maxOtpAttempts || 3,
          allowCustomerCancellation: res.data.allowCustomerCancellation ?? true,
        });
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put("/settings", formData);
      toast.success("System settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading system settings...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">System Settings ⚙️</h1>
        <p className="text-xs text-slate-500 mt-1">Company profile, default delivery parameters, and OTP policies</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600 border-b pb-2">
              🏢 Company Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Company Phone</label>
                <input
                  type="text"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Company Email</label>
                <input
                  type="email"
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Company Address</label>
                <input
                  type="text"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600 border-b pb-2">
              💧 Delivery & Ordering Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Default Delivery Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultDeliveryFee}
                  onChange={(e) => setFormData({ ...formData, defaultDeliveryFee: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="allowCancel"
                checked={formData.allowCustomerCancellation}
                onChange={(e) => setFormData({ ...formData, allowCustomerCancellation: e.target.checked })}
                className="h-4 w-4 rounded text-cyan-600"
              />
              <label htmlFor="allowCancel" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Allow customers to cancel orders when in PENDING status
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600 border-b pb-2">
              🔐 Security & OTP Policy
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">OTP Expiration (Seconds)</label>
                <input
                  type="number"
                  value={formData.otpExpiration}
                  onChange={(e) => setFormData({ ...formData, otpExpiration: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Maximum Failed OTP Attempts</label>
                <input
                  type="number"
                  value={formData.maxOtpAttempts}
                  onChange={(e) => setFormData({ ...formData, maxOtpAttempts: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-cyan-700 shadow-md shadow-cyan-600/20"
            >
              Save System Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
