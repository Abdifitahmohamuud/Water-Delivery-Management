import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { FiPlus, FiX, FiLoader, FiTrendingDown, FiTrendingUp, FiAlertTriangle, FiSearch, FiArchive, FiPackage } from "react-icons/fi";

const AdminInventory = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    productId: "",
    type: "STOCK_IN",
    quantity: "",
    note: ""
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data } = await api.get("/products");
      return data;
    },
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data } = await api.get("/admin/inventory");
      return data;
    },
  });

  const logMutation = useMutation({
    mutationFn: (data) => api.post("/admin/inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-inventory"]);
      queryClient.invalidateQueries(["products"]);
      toast.success("Inventory log added!");
      setIsModalOpen(false);
      setFormData({ productId: "", type: "STOCK_IN", quantity: "", note: "" });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to add inventory log");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) {
      toast.error("Please fill all required fields");
      return;
    }
    logMutation.mutate(formData);
  };

  const lowStockProducts = products?.filter(p => p.stock < 10) || [];
  const totalStockItems = products?.reduce((acc, p) => acc + p.stock, 0) || 0;

  const filteredLogs = logs?.filter(log => 
    log.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.note?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Inventory Management</h1>
          <p className="text-slate-400">Track stock levels, manage movements, and monitor alerts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search movements..." 
              className="bg-slate-900/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#16a34a] transition-all w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center gap-2 bg-[#16a34a] text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#16a34a]/20"
            onClick={() => setIsModalOpen(true)}
          >
            <FiPlus className="text-xl" />
            <span>Record Movement</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <FiPackage className="text-xl" />
            </div>
            <p className="text-slate-400 font-medium">Total Inventory</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{totalStockItems} Items</h3>
          <p className="text-xs text-slate-500 mt-2">Across all categories</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <FiTrendingUp className="text-xl" />
            </div>
            <p className="text-slate-400 font-medium">Active SKU's</p>
          </div>
          <h3 className="text-3xl font-bold text-white">{products?.length || 0}</h3>
          <p className="text-xs text-slate-500 mt-2">Products in catalog</p>
        </div>

        <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <FiAlertTriangle className="text-xl" />
            </div>
            <p className="text-red-400/60 font-medium">Low Stock Alerts</p>
          </div>
          <h3 className="text-3xl font-bold text-red-500">{lowStockProducts.length}</h3>
          <p className="text-xs text-red-400/40 mt-2">Require restocking</p>
        </div>
      </div>

      {/* Low Stock Detailed Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="text-amber-500 text-xl animate-pulse" />
            <p className="text-amber-400 font-semibold">Critical Stock Levels:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map(p => (
              <span key={p.id} className="px-3 py-1 bg-amber-500/10 text-amber-300 text-xs rounded-full border border-amber-500/20">
                {p.name} ({p.stock})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl backdrop-blur-sm overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <FiArchive className="text-[#16a34a]" />
            Stock Movement History
          </h3>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold bg-white/5 px-3 py-1 rounded-full">
            Recent Logs
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-sm font-semibold border-b border-white/5">
                <th className="px-8 py-5">Product Details</th>
                <th className="px-8 py-5">Movement Type</th>
                <th className="px-8 py-5 text-center">Qty</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <FiLoader className="text-3xl text-[#16a34a] animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">Fetching logs...</p>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <p className="text-white font-medium group-hover:text-[#16a34a] transition-colors">{log.product?.name || "Deleted Product"}</p>
                      <p className="text-xs text-slate-500 mt-1">ID: #{log.productId?.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        log.type === 'STOCK_IN' || log.type === 'RETURNED' ? 'bg-emerald-500/10 text-emerald-400' : 
                        log.type === 'STOCK_OUT' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {log.type === 'STOCK_IN' || log.type === 'RETURNED' ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <p className={`text-lg font-bold ${
                        log.type === 'STOCK_IN' || log.type === 'RETURNED' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {log.type === 'STOCK_IN' || log.type === 'RETURNED' ? '+' : '-'}{log.quantity}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-sm">
                      {new Date(log.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <p className="text-[10px] text-slate-600 mt-1 uppercase">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-8 py-6 max-w-xs">
                      <p className="text-slate-500 text-xs italic line-clamp-2">{log.note || "No comments"}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <p className="text-slate-500 italic">No movements match your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal - Modern Refactor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex justify-center items-center z-[2000] p-6">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#16a34a]/5 rounded-full blur-3xl"></div>
            
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-bold text-white">Stock Adjustment</h3>
                <p className="text-slate-400 text-sm mt-1">Update inventory levels for your products.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 transition-all">
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Target Product</label>
                  <select 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 ring-[#16a34a]/20 focus:border-[#16a34a] transition-all appearance-none"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                    required
                  >
                    <option value="" className="bg-slate-900">Select Item...</option>
                    {products?.map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">
                        {p.name} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Adjustment Type</label>
                  <select 
                    className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 ring-[#16a34a]/20 focus:border-[#16a34a] transition-all appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="STOCK_IN" className="bg-slate-900">Stock In (+)</option>
                    <option value="STOCK_OUT" className="bg-slate-900">Stock Out (-)</option>
                    <option value="DAMAGED" className="bg-slate-900">Damaged (-)</option>
                    <option value="RETURNED" className="bg-slate-900">Returned (+)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300 ml-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 ring-[#16a34a]/20 focus:border-[#16a34a] transition-all"
                  placeholder="Enter adjustment amount"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300 ml-1">Reason / Note</label>
                <textarea 
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 ring-[#16a34a]/20 focus:border-[#16a34a] transition-all min-h-[120px] resize-none"
                  placeholder="Why is this change being made?"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-750 text-white rounded-2xl font-bold transition-all border border-white/5"
                  onClick={() => setIsModalOpen(false)}
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] flex items-center justify-center gap-3 px-8 py-4 bg-[#16a34a] text-black rounded-2xl font-bold hover:shadow-2xl hover:shadow-[#16a34a]/30 transition-all disabled:opacity-50"
                  disabled={logMutation.isPending}
                >
                  {logMutation.isPending ? <FiLoader className="animate-spin" /> : <FiArchive />}
                  {logMutation.isPending ? "Processing..." : "Commit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;

