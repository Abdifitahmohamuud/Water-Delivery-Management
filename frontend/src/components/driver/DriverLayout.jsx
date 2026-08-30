import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { playAssignmentSound } from "../../lib/soundAlerts";

export default function DriverLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const [availability, setAvailability] = useState(user?.driver?.availabilityStatus || "AVAILABLE");
  const [updating, setUpdating] = useState(false);

  // New Assignment Popup State
  const [assignmentModal, setAssignmentModal] = useState(null);
  const knownAssignmentsRef = useRef(new Map());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (user?.driver?.availabilityStatus) {
      setAvailability(user.driver.availabilityStatus);
    }
  }, [user]);

  // Real-time assignment listener for Driver
  useEffect(() => {
    let isMounted = true;

    const checkAssignments = async () => {
      try {
        const res = await api.get("/drivers/orders");
        const orders = Array.isArray(res.data) ? res.data : [];

        if (!isMounted) return;

        if (initialLoadRef.current) {
          orders.forEach((o) => knownAssignmentsRef.current.set(o.id, o.status));
          initialLoadRef.current = false;
          return;
        }

        for (const o of orders) {
          const prevStatus = knownAssignmentsRef.current.get(o.id);
          if (!prevStatus && o.status === "ASSIGNED") {
            playAssignmentSound();
            setAssignmentModal(o);
          }
          knownAssignmentsRef.current.set(o.id, o.status);
        }
      } catch (error) {
        console.error("Driver assignment check error:", error);
      }
    };

    checkAssignments();
    const interval = setInterval(checkAssignments, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put("/drivers/availability", { availabilityStatus: newStatus });
      setAvailability(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update availability status");
    } finally {
      setUpdating(false);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/driver", icon: "📊" },
    { label: "Assigned Orders", path: "/driver/orders", icon: "📦" },
    { label: "Active Delivery", path: "/driver/active", icon: "🚚" },
    { label: "History", path: "/driver/history", icon: "📋" },
    { label: "Profile", path: "/driver/profile", icon: "👤" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f9ff", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: "#0284c7",
          color: "#ffffff",
          padding: "1rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)",
        }}
      >
        <div style={{ display: "flex", itemsCenter: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#e0f2fe",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "1.2rem",
            }}
          >
            💧
          </div>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "#ffffff" }}>
              Driver Portal
            </h2>
            <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>
              Welcome, {user?.fullName || "Driver"}
            </span>
          </div>
        </div>

        {/* Availability Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <select
            value={availability}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "20px",
              border: "none",
              fontWeight: "600",
              fontSize: "0.85rem",
              backgroundColor:
                availability === "AVAILABLE"
                  ? "#22c55e"
                  : availability === "BUSY"
                  ? "#eab308"
                  : "#94a3b8",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            <option value="AVAILABLE" style={{ color: "#000" }}>🟢 AVAILABLE</option>
            <option value="BUSY" style={{ color: "#000" }}>🟡 BUSY</option>
            <option value="OFFLINE" style={{ color: "#000" }}>⚪ OFFLINE</option>
          </select>

          <button
            onClick={logout}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.4)",
              backgroundColor: "transparent",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation bar */}
      <nav
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-around",
          padding: "0.5rem 0",
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                textDecoration: "none",
                color: isActive ? "#0284c7" : "#64748b",
                fontWeight: isActive ? "700" : "500",
                fontSize: "0.8rem",
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                backgroundColor: isActive ? "#f0f9ff" : "transparent",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "1.25rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
        <Outlet />
      </main>

      {/* 🟦 SKY-BLUE / CYAN POPUP MODAL FOR DRIVER NEW ASSIGNMENT */}
      {assignmentModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 200,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "1.5rem",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(2, 132, 199, 0.3)",
              border: "3px solid #0284c7",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>📦</span>
                <div>
                  <span style={{ backgroundColor: "#0284c7", color: "#fff", fontSize: "0.7rem", fontWeight: "800", padding: "0.2rem 0.6rem", borderRadius: "10px", textTransform: "uppercase" }}>
                    New Delivery Assignment
                  </span>
                  <h3 style={{ margin: "0.2rem 0 0 0", color: "#0369a1", fontSize: "1.2rem" }}>
                    {assignmentModal.orderNumber}
                  </h3>
                </div>
              </div>
              <button onClick={() => setAssignmentModal(null)} style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8" }}>
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#f0f9ff", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.95rem" }}>
              <div>👤 <strong>Customer:</strong> {assignmentModal.customer?.user?.fullName}</div>
              <div>📞 <strong>Phone:</strong> <a href={`tel:${assignmentModal.customer?.user?.phone}`} style={{ color: "#0284c7", fontWeight: "700" }}>{assignmentModal.customer?.user?.phone}</a></div>
              <div>📍 <strong>Address:</strong> {assignmentModal.deliveryAddress}</div>
              <div>💧 <strong>Product:</strong> {assignmentModal.product?.name} (Qty: <strong>{assignmentModal.requestedQuantity}</strong>)</div>
              {assignmentModal.deliveryNotes && <div style={{ fontSize: "0.85rem", fontStyle: "italic", color: "#475569" }}>📝 Note: {assignmentModal.deliveryNotes}</div>}
            </div>

            <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
              <Link
                to="/driver/orders"
                onClick={() => setAssignmentModal(null)}
                style={{
                  flex: 1,
                  textAlign: "center",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  padding: "0.8rem",
                  borderRadius: "12px",
                  fontWeight: "700",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                Review & Accept Assignment →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
