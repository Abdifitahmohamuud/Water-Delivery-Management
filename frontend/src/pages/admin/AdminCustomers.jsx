import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    accountStatus: "ACTIVE",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    accountStatus: "ACTIVE",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/customers", { params: { search } });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.customers)
        ? res.data.customers
        : [];
      setCustomers(list);
    } catch (error) {
      toast.error("Failed to load customer accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      await api.post("/admin/customers", createForm);
      toast.success("New customer account created!");
      setCreateModalOpen(false);
      setCreateForm({ fullName: "", phone: "", email: "", password: "", accountStatus: "ACTIVE" });
      fetchCustomers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create customer");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setEditForm({
      fullName: c.user?.fullName || "",
      phone: c.user?.phone || "",
      email: c.user?.email || "",
      password: "",
      accountStatus: c.user?.accountStatus || "ACTIVE",
    });
    setEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditSubmitting(true);
    try {
      await api.put(`/admin/customers/${editingCustomer.id}`, editForm);
      toast.success("Customer account updated successfully!");
      setEditModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update customer");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (customerId, name) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/customers/${customerId}`);
      toast.success("Customer account deleted successfully");
      fetchCustomers();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleToggleStatus = async (c) => {
    const nextStatus = c.user?.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.put(`/admin/customers/${c.id}`, { accountStatus: nextStatus });
      toast.success(`Account status set to ${nextStatus}`);
      fetchCustomers();
    } catch (error) {
      toast.error("Failed to change account status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Customer Accounts Management 👥</h1>
          <p className="text-xs text-slate-500 mt-1">Full CRUD: Create, Edit, Suspend, Deactivate, and Delete customer profiles</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-md shadow-cyan-600/20"
        >
          + Add New Customer
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
        <span className="text-slate-400">🔍</span>
        <input
          type="text"
          placeholder="Search by customer name, phone number, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none text-sm font-semibold text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No customer records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Orders Placed</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{c.user?.fullName || "Customer"}</td>
                    <td className="p-4">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">📞 {c.user?.phone}</div>
                      <div className="text-xs text-slate-400">✉️ {c.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(c.user?.accountStatus)}`}>
                        {c.user?.accountStatus || "ACTIVE"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-cyan-600">{c.ordersCount || 0} orders</td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(c.createdAt || c.user?.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`font-bold px-3 py-1.5 rounded-lg text-xs transition ${
                          c.user?.accountStatus === "ACTIVE"
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {c.user?.accountStatus === "ACTIVE" ? "Suspend" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(c.id, c.user?.fullName)}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Customer Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  placeholder="Ali Mohamed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  placeholder="061xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  placeholder="ali@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">User Account Role *</label>
                <select
                  value={createForm.role || "CUSTOMER"}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="CUSTOMER">CUSTOMER (Standard Buyer Account)</option>
                  <option value="DRIVER">DRIVER (Water Tanker Delivery Fleet)</option>
                  <option value="ADMIN">ADMIN (System Administrator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Initial Status</label>
                <select
                  value={createForm.accountStatus}
                  onChange={(e) => setCreateForm({ ...createForm, accountStatus: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={createSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
              >
                {createSubmitting ? "Creating..." : "Create Customer Account"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Customer Account</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Set New Password (Optional)</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  placeholder="Leave blank to keep unchanged"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Account Status</label>
                <select
                  value={editForm.accountStatus}
                  onChange={(e) => setEditForm({ ...editForm, accountStatus: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={editSubmitting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-sm transition"
              >
                {editSubmitting ? "Saving..." : "Save Customer Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadge(status) {
  switch (status) {
    case "ACTIVE": return "bg-emerald-100 text-emerald-800";
    case "PENDING_VERIFICATION": return "bg-amber-100 text-amber-800";
    case "SUSPENDED": return "bg-rose-100 text-rose-800";
    case "DEACTIVATED": return "bg-slate-100 text-slate-700";
    default: return "bg-slate-100 text-slate-700";
  }
}