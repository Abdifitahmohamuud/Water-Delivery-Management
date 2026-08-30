import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
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
  if (prod.imageUrl) return prod.imageUrl;
  const name = prod.name?.toLowerCase() || "";
  if (name.includes("bottle")) return DEFAULT_WATER_IMAGES.bottle;
  if (name.includes("container")) return DEFAULT_WATER_IMAGES.container;
  if (name.includes("tanker") || name.includes("bulk")) return DEFAULT_WATER_IMAGES.tanker;
  return DEFAULT_WATER_IMAGES.jerrycan;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (user && user.role === "CUSTOMER") {
        const res = await api.get("/customers/dashboard");
        setDashboardData(res.data);
      }
      const prodRes = await api.get("/products");
      setProducts(prodRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const streamRefresh = useCallback(() => {
    fetchData(true);
  }, [user]);

  useAutoRefresh(streamRefresh, 3500);

  useEffect(() => {
    fetchData();
  }, [user]);

  const activeOrder = dashboardData?.activeOrder;
  const recentOrders = dashboardData?.recentOrders || [];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-950 text-white font-sans selection:bg-cyan-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-900 via-cyan-700 to-blue-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border border-cyan-500/30">
          <div className="space-y-4 max-w-2xl relative z-10">
            <span className="bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest inline-block shadow-md">
              💧 Premium Water Logistics Platform
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Welcome Back, {user?.fullName || "Valued Customer"}!
            </h1>
            <p className="text-sm sm:text-base text-cyan-100/90 leading-relaxed font-medium">
              Order purified 20L Jerrycans, 10L containers, or packaged bottles with live dispatch tracking directly to your door.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/checkout"
                className="bg-white text-cyan-900 hover:bg-cyan-50 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
              >
                + Order Water Now
              </Link>
              <Link
                to="/shop"
                className="bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-900/60 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all"
              >
                Explore Catalog →
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <div className="h-44 w-44 rounded-3xl bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 p-4 flex items-center justify-center text-7xl shadow-2xl">
              💧
            </div>
          </div>
        </div>

        {/* Active Order Highlight Card */}
        {user && activeOrder && (
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/80 shadow-2xl shadow-cyan-500/10 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="bg-cyan-500 text-white font-black px-3.5 py-1 rounded-full text-xs uppercase tracking-wider">
                  Active Order
                </span>
                <span className="font-black text-cyan-400 text-lg">{activeOrder.orderNumber}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Status: <strong className="text-white">{activeOrder.status}</strong>
              </span>
            </div>

            {/* Live Progress Stepper */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Live Delivery Progress</span>
              <div className="grid grid-cols-4 text-center text-xs font-bold gap-2">
                <TimelineStep label="Placed" active={true} />
                <TimelineStep label="Assigned" active={["ASSIGNED", "ACCEPTED", "IN_DELIVERY", "DELIVERED"].includes(activeOrder.status)} />
                <TimelineStep label="On the Way" active={["IN_DELIVERY", "DELIVERED"].includes(activeOrder.status)} />
                <TimelineStep label="Delivered" active={activeOrder.status === "DELIVERED"} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <span className="text-xs text-slate-400 font-bold uppercase block">Product & Requested Quantity</span>
                <p className="font-bold text-white mt-1">
                  💧 {activeOrder.product?.name} ({activeOrder.requestedQuantity} requested)
                </p>
              </div>

              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50">
                <span className="text-xs text-slate-400 font-bold uppercase block">Assigned Delivery Driver</span>
                <p className="font-bold text-white mt-1">
                  {activeOrder.assignedDriver?.user?.fullName ? (
                    <>🚚 {activeOrder.assignedDriver.user.fullName}</>
                  ) : (
                    "Assigning driver..."
                  )}
                </p>
              </div>
            </div>

            {activeOrder.assignedDriver?.user?.phone && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`tel:${activeOrder.assignedDriver.user.phone}`}
                  className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-emerald-600/20"
                >
                  📞 Call Driver ({activeOrder.assignedDriver.user.phone})
                </a>
                <Link
                  to={`/order/${activeOrder.id}`}
                  className="flex-1 text-center bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-600/20"
                >
                  Track Order Details
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Featured Water Products Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">Available Sizes</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Purified Water Catalog</h2>
            </div>
            <Link to="/shop" className="text-xs font-black text-cyan-400 hover:underline uppercase tracking-wider">
              View Full Catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="group bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                    <img
                      src={getProductImage(prod)}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                    <span className="absolute top-4 left-4 bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      {prod.unit}
                    </span>
                    <span className="absolute bottom-3 right-4 text-2xl font-black text-white">
                      ${prod.currentPrice.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-6 space-y-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {prod.description || "Purified drinking water compliant with safety standards."}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => navigate(`/checkout?productId=${prod.id}`)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-600/20"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineStep({ label, active }) {
  return (
    <div className={`p-2.5 rounded-xl border font-black ${active ? "bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/30" : "bg-slate-800 text-slate-500 border-slate-700/60"}`}>
      {label}
    </div>
  );
}
