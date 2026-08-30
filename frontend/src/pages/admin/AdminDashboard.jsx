import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setData(res.data);
    } catch (error) {
      toast.error("Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Water Delivery Dashboard...</div>;
  }

  const { stats = {}, counts = {}, recentOrders = [] } = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-700 to-blue-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black">Water Delivery Control Center 💧</h1>
          <p className="text-cyan-100 text-sm mt-1">Real-time water supply, driver assignments, and delivery tracking</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/orders"
            className="bg-white text-cyan-800 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-cyan-50 transition shadow"
          >
            Manage Orders ({stats.pending || 0} Pending)
          </Link>
          <Link
            to="/admin/drivers"
            className="bg-cyan-900/60 text-white font-bold px-4 py-2.5 rounded-xl text-sm border border-cyan-400/30 hover:bg-cyan-900 transition"
          >
            Drivers ({counts.availableDrivers || 0} Available)
          </Link>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Pending" count={stats.pending || 0} color="bg-amber-50 text-amber-700 border-amber-200" icon="⏳" />
        <KpiCard title="Assigned" count={stats.assigned || 0} color="bg-sky-50 text-sky-700 border-sky-200" icon="📥" />
        <KpiCard title="Accepted" count={stats.accepted || 0} color="bg-blue-50 text-blue-700 border-blue-200" icon="✅" />
        <KpiCard title="On the Way" count={stats.inDelivery || 0} color="bg-purple-50 text-purple-700 border-purple-200" icon="🚚" />
        <KpiCard title="Delivered" count={stats.delivered || 0} color="bg-emerald-50 text-emerald-700 border-emerald-200" icon="🏆" />
        <KpiCard title="Cancelled" count={stats.cancelled || 0} color="bg-rose-50 text-rose-700 border-rose-200" icon="❌" />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Customers</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{counts.customers || 0}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-2">Active customer accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fleet Drivers</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{counts.drivers || 0}</div>
          <div className="text-xs text-sky-600 font-semibold mt-2">
            🟢 {counts.availableDrivers || 0} Currently Available
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Completed Orders</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{counts.deliveredOrders || 0}</div>
          <div className="text-xs text-purple-600 font-semibold mt-2">Out of {counts.totalOrders || 0} total created</div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Water Orders</h2>
          <Link to="/admin/orders" className="text-sm font-bold text-cyan-600 hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Product & Qty</th>
                <th className="p-3">Address</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-cyan-600">{ord.orderNumber}</td>
                  <td className="p-3 font-medium text-slate-900 dark:text-white">{ord.customer?.user?.fullName || "Customer"}</td>
                  <td className="p-3">{ord.product?.name} ({ord.requestedQuantity} requested)</td>
                  <td className="p-3 text-slate-500 max-w-xs truncate">{ord.deliveryAddress}</td>
                  <td className="p-3 font-medium">
                    {ord.assignedDriver?.user?.fullName ? (
                      <span className="text-slate-800 dark:text-slate-200">🚚 {ord.assignedDriver.user.fullName}</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-bold">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(ord.status)}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">{new Date(ord.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, count, color, icon }) {
  return (
    <div className={`p-4 rounded-2xl border ${color} flex flex-col items-center justify-center text-center shadow-sm`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-black mt-1">{count}</span>
      <span className="text-xs font-bold tracking-wider uppercase mt-1 opacity-80">{title}</span>
    </div>
  );
}

function getStatusBadge(status) {
  switch (status) {
    case "PENDING": return "bg-amber-100 text-amber-800";
    case "ASSIGNED": return "bg-sky-100 text-sky-800";
    case "ACCEPTED": return "bg-blue-100 text-blue-800";
    case "IN_DELIVERY": return "bg-purple-100 text-purple-800";
    case "DELIVERED": return "bg-emerald-100 text-emerald-800";
    case "CANCELLED": return "bg-rose-100 text-rose-800";
    case "REJECTED": return "bg-orange-100 text-orange-800";
    default: return "bg-slate-100 text-slate-800";
  }
}