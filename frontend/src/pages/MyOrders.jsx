import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import useAutoRefresh from "../hooks/useAutoRefresh";

const DEFAULT_WATER_IMAGES = {
  jerrycan: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80",
  container: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=600&q=80",
  bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
  tanker: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
};

function getProductImage(prod) {
  if (prod?.imageUrl) return prod.imageUrl;
  const name = prod?.name?.toLowerCase() || "";
  if (name.includes("bottle")) return DEFAULT_WATER_IMAGES.bottle;
  if (name.includes("container")) return DEFAULT_WATER_IMAGES.container;
  if (name.includes("tanker") || name.includes("bulk")) return DEFAULT_WATER_IMAGES.tanker;
  return DEFAULT_WATER_IMAGES.jerrycan;
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/customers/orders", {
        params: { status: activeTab !== "ALL" ? activeTab : undefined },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.orders)
        ? res.data.orders
        : [];
      setOrders(list);
    } catch (error) {
      if (!silent) toast.error("Failed to load your water orders");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const streamRefresh = useCallback(() => {
    fetchOrders(true);
  }, [activeTab]);

  useAutoRefresh(streamRefresh, 3500);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this pending order?")) return;
    try {
      await api.post(`/customers/orders/${orderId}/cancel`, {
        reason: "Customer cancelled via portal",
      });
      toast.success("Order cancelled successfully");
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel order");
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Water Orders 💧</h1>
          <p className="text-xs text-slate-500 mt-1">Track active deliveries, requested quantities, and completed history</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {["ALL", "PENDING", "ASSIGNED", "ACCEPTED", "IN_DELIVERY", "DELIVERED", "CANCELLED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                activeTab === tab
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center space-y-3 border border-slate-200 dark:border-slate-800">
            <span className="text-4xl">📦</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Orders Found</h3>
            <p className="text-xs text-slate-500">You do not have any water orders in this status.</p>
            <Link
              to="/checkout"
              className="inline-block bg-cyan-600 text-white font-bold px-6 py-3 rounded-xl text-xs hover:bg-cyan-700 transition"
            >
              + Place a Water Order
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={getProductImage(ord.product)}
                    alt={ord.product?.name || "Water"}
                    className="h-16 w-16 rounded-2xl object-cover border shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-cyan-600 text-lg">{ord.orderNumber}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadge(ord.status)}`}>
                        {ord.status}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      💧 {ord.product?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      📍 {ord.deliveryAddress}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                      <span className="text-slate-700 dark:text-slate-300">
                        Requested Qty: <strong>{ord.requestedQuantity}</strong>
                      </span>
                      {ord.deliveredQuantity !== null && ord.deliveredQuantity !== undefined && (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          Actual Delivered: {ord.deliveredQuantity}
                        </span>
                      )}
                      <span className="text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <span className="text-xl font-black text-slate-900 dark:text-white">${ord.totalPrice}</span>
                  <Link
                    to={`/order/${ord.id}`}
                    className="bg-cyan-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-cyan-700 transition"
                  >
                    Details & Track
                  </Link>
                  {ord.status === "PENDING" && (
                    <button
                      onClick={() => handleCancelOrder(ord.id)}
                      className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold px-3 py-2.5 rounded-xl text-xs transition"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
    default: return "bg-slate-100 text-slate-800";
  }
}
