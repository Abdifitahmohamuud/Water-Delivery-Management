import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [drivers, setDrivers] = useState([]);

  // Modal States
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [reassigningOrder, setReassigningOrder] = useState(null);
  const [editingQtyOrder, setEditingQtyOrder] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [viewCustomerOrder, setViewCustomerOrder] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [reassignReason, setReassignReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/admin/orders", {
        params: {
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        },
      });
      setOrders(res.data?.orders || []);
    } catch (error) {
      if (!silent) toast.error("Failed to load orders");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const streamRefresh = useCallback(() => {
    fetchOrders(true);
  }, [statusFilter, searchQuery]);

  useAutoRefresh(streamRefresh, 3500);

  const fetchAvailableDrivers = async () => {
    try {
      const res = await api.get("/admin/drivers", {
        params: { availableOnly: "true", limit: 50 },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.drivers)
        ? res.data.drivers
        : [];
      setDrivers(list);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAvailableDrivers();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) return toast.error("Please select an available driver");
    setSubmitting(true);
    try {
      await api.post(`/admin/orders/${assigningOrder.id}/assign-driver`, {
        driverId: selectedDriverId,
      });
      toast.success("Driver assigned successfully!");
      setAssigningOrder(null);
      setSelectedDriverId("");
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign driver");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignDriver = async () => {
    if (!selectedDriverId) return toast.error("Please select a new driver");

    setSubmitting(true);
    try {
      await api.post(`/admin/orders/${reassigningOrder.id}/reassign-driver`, {
        driverId: selectedDriverId,
        reason: reassignReason || "Admin reassigned order",
      });
      toast.success("Driver reassigned successfully!");
      setReassigningOrder(null);
      setSelectedDriverId("");
      setReassignReason("");
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reassign driver");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuantitySubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || qty <= 0) return toast.error("Please enter a valid container quantity");

    setSubmitting(true);
    try {
      const res = await api.put(`/admin/orders/${editingQtyOrder.id}/quantity`, {
        requestedQuantity: qty,
      });
      toast.success(res.data?.message || "Order quantity updated successfully!");
      setEditingQtyOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update order quantity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Order Management 📦</h1>
          <p className="text-xs text-slate-500 mt-1">Assign/reassign drivers, modify container quantities, and inspect customer details</p>
        </div>

        {/* Filter & Search Controls */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED (Needs Reassignment)</option>
            <option value="IN_DELIVERY">IN_DELIVERY (On the Way)</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input
            type="text"
            placeholder="Search Order # or Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm flex-1 md:w-64"
          />

          <button
            type="submit"
            className="bg-cyan-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-cyan-700 transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No orders found matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Product & Qty</th>
                  <th className="p-4">Total Price</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-cyan-600">{ord.orderNumber}</td>
                    <td className="p-4">
                      <div
                        onClick={() => setViewCustomerOrder(ord)}
                        className="font-bold text-slate-900 dark:text-white cursor-pointer hover:underline text-sm"
                      >
                        👤 {ord.customer?.user?.fullName || "Customer"}
                      </div>
                      <div className="text-xs text-slate-500">📞 {ord.customer?.user?.phone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{ord.product?.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                          Req: {ord.requestedQuantity}
                        </span>
                        {ord.deliveredQuantity !== null && ord.deliveredQuantity !== undefined && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Del: {ord.deliveredQuantity}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setEditingQtyOrder(ord);
                            setNewQuantity(ord.requestedQuantity);
                          }}
                          className="text-[11px] text-cyan-600 hover:underline font-bold"
                        >
                          ✏️ Edit Qty
                        </button>
                      </div>
                    </td>
                    <td className="p-4 font-bold">${ord.totalPrice?.toFixed(2)}</td>
                    <td className="p-4">
                      {ord.assignedDriver?.user?.fullName ? (
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            🚚 {ord.assignedDriver.user.fullName}
                          </div>
                          <div className="text-xs text-slate-400">{ord.assignedDriver.user.phone}</div>
                        </div>
                      ) : (
                        <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {["PENDING", "REJECTED"].includes(ord.status) && (
                        <button
                          onClick={() => {
                            setAssigningOrder(ord);
                            setSelectedDriverId("");
                            fetchAvailableDrivers();
                          }}
                          className="bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-cyan-700 transition"
                        >
                          {ord.status === "REJECTED" ? "Reassign (Rejected)" : "Assign Driver"}
                        </button>
                      )}

                      {["ASSIGNED", "ACCEPTED", "IN_DELIVERY"].includes(ord.status) && (
                        <button
                          onClick={() => {
                            setReassigningOrder(ord);
                            setSelectedDriverId("");
                            setReassignReason("");
                            fetchAvailableDrivers();
                          }}
                          className="bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-amber-700 transition"
                        >
                          Reassign Driver
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Quantity Modal */}
      {editingQtyOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Modify Quantity for Order {editingQtyOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Update requested quantity (e.g. Customer took 15 jerrycans instead of 10). Total price will automatically recalculate.
            </p>

            <form onSubmit={handleUpdateQuantitySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">New Requested Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQtyOrder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700"
                >
                  Update & Recalculate Total
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Info Modal */}
      {viewCustomerOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customer Details</h3>
              <button onClick={() => setViewCustomerOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div><span className="text-xs text-slate-400 block uppercase font-bold">Full Name</span><strong className="text-slate-900 dark:text-white text-base">{viewCustomerOrder.customer?.user?.fullName}</strong></div>
              <div><span className="text-xs text-slate-400 block uppercase font-bold">Phone Number</span><strong className="text-cyan-600">{viewCustomerOrder.customer?.user?.phone}</strong></div>
              <div><span className="text-xs text-slate-400 block uppercase font-bold">Email Address</span><span>{viewCustomerOrder.customer?.user?.email}</span></div>
              <div><span className="text-xs text-slate-400 block uppercase font-bold">Delivery Address</span><p className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl font-semibold mt-1">{viewCustomerOrder.deliveryAddress}</p></div>
              {viewCustomerOrder.deliveryNotes && <div><span className="text-xs text-slate-400 block uppercase font-bold">Delivery Notes</span><p className="italic text-slate-600">{viewCustomerOrder.deliveryNotes}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Assign Driver Modal (Filters Available & Busy Drivers) */}
      {assigningOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Assign Driver to {assigningOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Customer: {assigningOrder.customer?.user?.fullName} | Address: {assigningOrder.deliveryAddress}
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Select Available / Active Driver (Offline drivers hidden)
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="">-- Choose Driver (Available / Busy) --</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.user?.fullName} ({drv.availabilityStatus}) - 📞 {drv.user?.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAssigningOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDriver}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Driver Modal */}
      {reassigningOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Reassign Order {reassigningOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Current Driver: {reassigningOrder.assignedDriver?.user?.fullName || "None"}
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Replacement Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="">-- Choose Driver (Available / Busy) --</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.user?.fullName} ({drv.availabilityStatus}) - 📞 {drv.user?.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Reason for Reassignment</label>
              <textarea
                rows={2}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="E.g., Original driver vehicle broke down or rejected order"
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReassigningOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignDriver}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
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