import { Outlet, Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import AdminSidebar from "./AdminSidebar";
import useAuthStore from "../../store/useAuthStore";
import api from "../../lib/api";
import { playNewOrderSound, playDeliverySuccessSound } from "../../lib/soundAlerts";
import {
  ArrowLeft,
  LogOut,
  MoonStar,
  ShieldCheck,
  SunMedium,
  UserRound,
} from "lucide-react";
import brandLogo from "../../assets/logo.png";
import NotificationBell from "../NotificationBell";

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // Alert Modal States
  const [newOrderModal, setNewOrderModal] = useState(null);
  const [deliveredModal, setDeliveredModal] = useState(null);

  // Track known order IDs and statuses for delta detection
  const knownOrdersRef = useRef(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme !== "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Real-time delta streaming listener for Admin alerts
  useEffect(() => {
    let isMounted = true;

    const checkOrderEvents = async () => {
      try {
        const res = await api.get("/admin/orders", { params: { limit: 30 } });
        const orders = res.data?.orders || [];

        if (!isMounted) return;

        if (initialLoadRef.current) {
          // Store baseline orders without firing alerts on page reload
          orders.forEach((o) => knownOrdersRef.current.set(o.id, o.status));
          initialLoadRef.current = false;
          return;
        }

        for (const o of orders) {
          const prevStatus = knownOrdersRef.current.get(o.id);

          // Event 1: Completely new PENDING order placed by customer
          if (!prevStatus && o.status === "PENDING") {
            playNewOrderSound();
            setNewOrderModal(o);
          }

          // Event 2: Order status transitioned to DELIVERED by a driver
          if (prevStatus && prevStatus !== "DELIVERED" && o.status === "DELIVERED") {
            playDeliverySuccessSound();
            setDeliveredModal(o);
          }

          knownOrdersRef.current.set(o.id, o.status);
        }
      } catch (error) {
        console.error("Admin real-time event check error:", error);
      }
    };

    checkOrderEvents();
    const interval = setInterval(checkOrderEvents, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const photoUrl = user?.profilePhotoUrl
    ? (user.profilePhotoUrl.startsWith("http") ? user.profilePhotoUrl : `http://localhost:5000${user.profilePhotoUrl}`)
    : null;

  return (
    <div className="dashboard-shell min-h-screen text-[color:var(--text-main)] flex flex-col md:flex-row font-sans">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="dashboard-topbar px-5 md:px-8">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="brand" className="h-10 w-10 rounded-2xl object-cover border border-[color:var(--border-color)]" />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--primary)]">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--accent)] animate-pulse" />
                  Admin workspace
                </div>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">Operations, catalog, and revenue control</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                aria-label="Toggle color theme"
                className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] text-[color:var(--text-main)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <SunMedium className="h-4 w-4 text-[color:var(--accent)]" />
                ) : (
                  <MoonStar className="h-4 w-4 text-[color:var(--primary)]" />
                )}
              </button>

              <Link
                to="/"
                className="hidden items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--text-main)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] sm:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Market home
              </Link>

              <div className="hidden items-center gap-3 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-2 md:flex">
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[color:var(--bg-card-solid)] text-[color:var(--primary)]">
                  {photoUrl ? <img src={photoUrl} alt={user?.name} className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-[color:var(--text-main)]">{user?.name || "System Admin"}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--primary)]">
                    <ShieldCheck className="h-3 w-3" /> Administrator
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[color:var(--primary-hover)]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-content flex-1">
          <Outlet />
        </main>
      </div>

      {/* 🔴 RED POPUP MODAL: NEW WATER ORDER PLACED */}
      {newOrderModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl shadow-rose-500/20 text-white">
            <div className="flex items-center justify-between border-b border-rose-500/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-500 font-bold text-xl flex items-center justify-center animate-bounce">
                  🚨
                </span>
                <div>
                  <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    NEW ORDER RECEIVED
                  </span>
                  <h3 className="text-xl font-black mt-1 text-white">{newOrderModal.orderNumber}</h3>
                </div>
              </div>
              <button
                onClick={() => setNewOrderModal(null)}
                className="text-slate-400 hover:text-white font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <strong className="text-white">{newOrderModal.customer?.user?.fullName || "Customer"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contact Phone:</span>
                <strong className="text-cyan-400">📞 {newOrderModal.customer?.user?.phone || newOrderModal.phone}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product:</span>
                <strong className="text-white">💧 {newOrderModal.product?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Qty:</span>
                <strong className="text-rose-400 font-black">{newOrderModal.requestedQuantity} container(s)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Price:</span>
                <strong className="text-2xl font-black text-emerald-400">${newOrderModal.totalPrice?.toFixed(2)}</strong>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-xs block">Delivery Address:</span>
                <p className="font-semibold text-slate-200 mt-0.5">{newOrderModal.deliveryAddress}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/orders"
                onClick={() => setNewOrderModal(null)}
                className="flex-1 text-center bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-rose-600/30"
              >
                Go to Assign Driver →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 GREEN POPUP MODAL: ORDER DELIVERED SUCCESSFULLY */}
      {deliveredModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl shadow-emerald-500/20 text-white">
            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 font-bold text-xl flex items-center justify-center">
                  🏆
                </span>
                <div>
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                    DELIVERY COMPLETED SUCCESS
                  </span>
                  <h3 className="text-xl font-black mt-1 text-white">{deliveredModal.orderNumber}</h3>
                </div>
              </div>
              <button
                onClick={() => setDeliveredModal(null)}
                className="text-slate-400 hover:text-white font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <strong className="text-white">{deliveredModal.customer?.user?.fullName || "Customer"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivered By Driver:</span>
                <strong className="text-cyan-400">🚚 {deliveredModal.assignedDriver?.user?.fullName || "Driver"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product:</span>
                <strong className="text-white">💧 {deliveredModal.product?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Actual Delivered Qty:</span>
                <strong className="text-emerald-400 font-black">
                  {deliveredModal.deliveredQuantity !== null && deliveredModal.deliveredQuantity !== undefined
                    ? deliveredModal.deliveredQuantity
                    : deliveredModal.requestedQuantity}{" "}
                  container(s)
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Revenue Collected:</span>
                <strong className="text-2xl font-black text-emerald-400">${deliveredModal.totalPrice?.toFixed(2)}</strong>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/finance"
                onClick={() => setDeliveredModal(null)}
                className="flex-1 text-center bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition shadow-lg shadow-emerald-600/30"
              >
                View Finance Ledger →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
