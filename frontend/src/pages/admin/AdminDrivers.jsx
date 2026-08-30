import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Driver Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    vehicleNumber: "",
    vehicleType: "Water Tanker Truck",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/drivers");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.drivers)
        ? res.data.drivers
        : [];
      setDrivers(list);
    } catch (error) {
      toast.error("Failed to fetch drivers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/admin/create-driver", formData);
      toast.success("Driver account created successfully!");
      setModalOpen(false);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        vehicleNumber: "",
        vehicleType: "Water Tanker Truck",
      });
      fetchDrivers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create driver");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (driverId, currentStatus) => {
    try {
      await api.post(`/admin/drivers/${driverId}/deactivate`);
      toast.success("Driver account status updated");
      fetchDrivers();
    } catch (error) {
      toast.error("Failed to update driver status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Delivery Drivers Fleet 🚚</h1>
          <p className="text-xs text-slate-500 mt-1">Manage driver fleet accounts, availability, and delivery performance</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-cyan-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-cyan-700 transition"
        >
          + Add New Driver
        </button>
      </div>

      {/* Drivers List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading drivers...</div>
        ) : !Array.isArray(drivers) || drivers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No drivers currently registered in fleet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Driver Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Deliveries Completed</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(drivers) && drivers.map((drv) => (
                  <tr key={drv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{drv.user?.fullName}</td>
                    <td className="p-4">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">📞 {drv.user?.phone}</div>
                      <div className="text-xs text-slate-400">✉️ {drv.user?.email}</div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      🚚 {drv.vehicleType || "Truck"} ({drv.vehicleNumber || "N/A"})
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getAvailabilityBadge(drv.availabilityStatus)}`}>
                        {drv.availabilityStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          drv.user?.accountStatus === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {drv.user?.accountStatus}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-cyan-600 text-center">{drv._count?.completedDeliveries || 0}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleDeactivate(drv.id, drv.user?.accountStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white ${
                          drv.user?.accountStatus === "ACTIVE"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        {drv.user?.accountStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register New Fleet Driver</h3>

            <form onSubmit={handleCreateDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Mohamed Ali"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
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
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="driver@waterdelivery.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Vehicle Type</label>
                  <input
                    type="text"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    placeholder="WTR-8821"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700"
                >
                  Create Driver Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getAvailabilityBadge(status) {
  switch (status) {
    case "AVAILABLE": return "bg-emerald-100 text-emerald-800";
    case "BUSY": return "bg-amber-100 text-amber-800";
    case "OFFLINE": return "bg-slate-100 text-slate-700";
    default: return "bg-slate-100 text-slate-700";
  }
}
