import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await api.get("/admin/reports");
      setReports(res.data);
    } catch (error) {
      toast.error("Failed to load reporting data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Calculating system performance reports...</div>;
  }

  const {
    totalOrders = 0,
    deliveredOrders = 0,
    cancelledOrders = 0,
    pendingOrders = 0,
    totalRequestedQuantity = 0,
    totalDeliveredQuantity = 0,
    totalRevenue = 0,
    paidRevenue = 0,
    driverPerformance = [],
  } = reports || {};

  const quantityDisparity = totalRequestedQuantity - totalDeliveredQuantity;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Reports & Business Analytics 📊</h1>
        <p className="text-xs text-slate-500 mt-1">Water distribution volume, revenue breakdown, and delivery performance</p>
      </div>

      {/* Top Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Water Revenue</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-2">Paid: ${paidRevenue.toFixed(2)}</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Requested Volume</span>
          <div className="text-3xl font-black text-cyan-600 mt-1">{totalRequestedQuantity}</div>
          <div className="text-xs text-slate-500 mt-2">Total requested containers/units</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivered Volume</span>
          <div className="text-3xl font-black text-blue-600 mt-1">{totalDeliveredQuantity}</div>
          <div className="text-xs text-slate-500 mt-2">Actual delivered volume</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Quantity Difference</span>
          <div className="text-3xl font-black text-amber-600 mt-1">{quantityDisparity}</div>
          <div className="text-xs text-amber-700 mt-2">Disparity between requested and actual</div>
        </div>
      </div>

      {/* Driver Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Driver Delivery Performance</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="p-3">Driver</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Assigned Orders</th>
                <th className="p-3">Completed Deliveries</th>
                <th className="p-3">Total Volume Delivered</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {driverPerformance.map((dp) => (
                <tr key={dp.driverId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{dp.fullName}</td>
                  <td className="p-3 text-slate-500">{dp.phone}</td>
                  <td className="p-3 font-semibold">{dp.assignedCount}</td>
                  <td className="p-3 font-bold text-emerald-600">{dp.completedCount}</td>
                  <td className="p-3 font-bold text-cyan-600">{dp.totalDeliveredQuantity} units</td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                      {dp.availabilityStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
