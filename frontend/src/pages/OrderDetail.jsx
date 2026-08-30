import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

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

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetail = async () => {
    try {
      const res = await api.get(`/customers/orders/${id}`);
      setOrder(res.data);
    } catch (error) {
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.post(`/customers/orders/${id}/cancel`, {
        reason: "Customer cancelled via portal",
      });
      toast.success("Order cancelled");
      fetchOrderDetail();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel order");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading water order detail...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-slate-500">Order not found.</div>;
  }

  const {
    orderNumber,
    status,
    product,
    requestedQuantity,
    deliveredQuantity,
    unitPrice,
    subtotal,
    deliveryFee,
    totalPrice,
    deliveryAddress,
    deliveryNotes,
    assignedDriver,
    createdAt,
  } = order;

  return (
    <div className="min-h-screen pt-28 pb-16 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Link to="/my-orders" className="text-xs font-bold text-cyan-600 hover:underline mb-1 inline-block">
              ← Back to My Orders
            </Link>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Order {orderNumber}</h1>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(status)}`}>
            {status}
          </span>
        </div>

        {/* Product Image Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <img
            src={getProductImage(product)}
            alt={product?.name || "Water Product"}
            className="h-28 w-28 rounded-2xl object-cover border"
          />
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Product Container</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{product?.name}</h3>
            <p className="text-xs text-slate-500">{product?.description || "Purified drinking water container"}</p>
            <div className="text-lg font-black text-cyan-600 pt-1">${unitPrice?.toFixed(2)} per unit</div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Status Timeline</h3>
          <div className="grid grid-cols-5 text-center text-xs font-bold gap-2 pt-2">
            <TimelineStep label="Placed" active={true} />
            <TimelineStep label="Assigned" active={["ASSIGNED", "ACCEPTED", "IN_DELIVERY", "DELIVERED"].includes(status)} />
            <TimelineStep label="Accepted" active={["ACCEPTED", "IN_DELIVERY", "DELIVERED"].includes(status)} />
            <TimelineStep label="On the Way" active={["IN_DELIVERY", "DELIVERED"].includes(status)} />
            <TimelineStep label="Delivered" active={status === "DELIVERED"} />
          </div>
        </div>

        {/* Requested vs Delivered Quantity Highlight */}
        <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
              Quantity Summary
            </span>
            <div className="flex items-center gap-6 mt-2">
              <div>
                <span className="text-xs text-slate-500 block">Requested</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{requestedQuantity}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Actual Delivered</span>
                <span className="text-2xl font-black text-emerald-600">
                  {deliveredQuantity !== null && deliveredQuantity !== undefined ? deliveredQuantity : "Pending Delivery"}
                </span>
              </div>
            </div>
          </div>

          {status === "PENDING" && (
            <button
              onClick={handleCancelOrder}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition"
            >
              Cancel Order
            </button>
          )}
        </div>

        {/* Driver Contact Card */}
        {assignedDriver?.user && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Driver</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                🚚 {assignedDriver.user.fullName}
              </h3>
              <p className="text-xs text-slate-500">Vehicle: {assignedDriver.vehicleNumber || "Delivery Truck"}</p>
            </div>

            {assignedDriver.user.phone && (
              <a
                href={`tel:${assignedDriver.user.phone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md shadow-emerald-600/20"
              >
                📞 Call Driver ({assignedDriver.user.phone})
              </a>
            )}
          </div>
        )}

        {/* Order Details & Price Snapshot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">Delivery Information</h3>
            <div className="text-sm space-y-2">
              <div><span className="text-slate-400 text-xs block">Delivery Address:</span><strong className="text-slate-900 dark:text-white">{deliveryAddress}</strong></div>
              {deliveryNotes && <div><span className="text-slate-400 text-xs block">Notes:</span><span className="italic text-slate-600">{deliveryNotes}</span></div>}
              <div><span className="text-slate-400 text-xs block">Date Placed:</span><span>{new Date(createdAt).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">Price Breakdown</h3>
            <div className="text-sm space-y-2 border-b pb-3">
              <div className="flex justify-between"><span className="text-slate-500">Product:</span><strong className="text-slate-900 dark:text-white">{product?.name}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Unit Price:</span><span>${unitPrice?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Requested Quantity:</span><span>{requestedQuantity}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span>${subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery Fee:</span><span>${deliveryFee?.toFixed(2)}</span></div>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <span className="font-bold text-slate-900 dark:text-white">Total Amount:</span>
              <span className="text-2xl font-black text-cyan-600">${totalPrice?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineStep({ label, active }) {
  return (
    <div className={`p-2 rounded-xl border ${active ? "bg-cyan-600 text-white border-cyan-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200"}`}>
      {label}
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
