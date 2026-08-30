import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";

export default function DriverDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailabilityState] = useState("AVAILABLE");
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/drivers/dashboard");
      setData(res.data);
      if (res.data?.driver?.availabilityStatus) {
        setAvailabilityState(res.data.driver.availabilityStatus);
      }
    } catch (error) {
      if (!silent) toast.error("Failed to load driver dashboard");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const streamRefresh = useCallback(() => {
    fetchDashboard(true);
  }, []);

  useAutoRefresh(streamRefresh, 3000);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleStatusChange = async (newStatus) => {
    setUpdatingAvailability(true);
    try {
      await api.put("/drivers/availability", { status: newStatus });
      setAvailabilityState(newStatus);
      toast.success(`Your status is now ${newStatus}`);
      fetchDashboard();
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Loading Driver Dashboard...</div>;
  }

  const { driver, stats, activeDelivery, assignedOrders } = data || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Availability Status Header Selector */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.25rem 1.5rem",
          borderRadius: "16px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "#0f172a" }}>
            Welcome, {driver?.user?.fullName || "Driver"} 🚚
          </h2>
          <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            Vehicle: {driver?.vehicleNumber || "Tanker Truck"} ({driver?.vehicleType || "Water Tanker"})
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#475569" }}>Duty Status:</span>
          {["AVAILABLE", "BUSY", "OFFLINE"].map((st) => (
            <button
              key={st}
              disabled={updatingAvailability}
              onClick={() => handleStatusChange(st)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: "10px",
                fontSize: "0.75rem",
                fontWeight: "800",
                border: "none",
                cursor: "pointer",
                backgroundColor:
                  availability === st
                    ? st === "AVAILABLE"
                      ? "#16a34a"
                      : st === "BUSY"
                      ? "#d97706"
                      : "#dc2626"
                    : "#f1f5f9",
                color: availability === st ? "#ffffff" : "#64748b",
                transition: "all 0.2s ease",
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Active Delivery Highlight Card */}
      {activeDelivery ? (
        <div
          style={{
            backgroundColor: "#0284c7",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "1.5rem",
            boxShadow: "0 10px 25px rgba(2, 132, 199, 0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                padding: "0.3rem 0.8rem",
                borderRadius: "20px",
                fontSize: "0.8rem",
                fontWeight: "700",
                letterSpacing: "0.5px",
              }}
            >
              ACTIVE DELIVERY: {activeDelivery.status}
            </span>
            <span style={{ fontSize: "0.9rem", opacity: 0.9, fontWeight: "600" }}>
              {activeDelivery.orderNumber}
            </span>
          </div>

          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", marginBottom: "0.5rem" }}>
            👤 {activeDelivery.customer?.user?.fullName || "Customer"}
          </h3>
          <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
            📍 <strong>Address:</strong> {activeDelivery.deliveryAddress}
          </p>
          <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
            💧 <strong>Product:</strong> {activeDelivery.product?.name} ({activeDelivery.requestedQuantity} requested)
          </p>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <a
              href={`tel:${activeDelivery.customer?.user?.phone}`}
              style={{
                flex: 1,
                textAlign: "center",
                backgroundColor: "#ffffff",
                color: "#0284c7",
                padding: "0.75rem",
                borderRadius: "10px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              📞 Call Customer ({activeDelivery.customer?.user?.phone})
            </a>
            <Link
              to="/driver/active"
              style={{
                flex: 1,
                textAlign: "center",
                backgroundColor: "#0369a1",
                color: "#ffffff",
                padding: "0.75rem",
                borderRadius: "10px",
                fontWeight: "700",
                textDecoration: "none",
                display: "inline-block",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              🚀 Process Delivery
            </Link>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "1.5rem",
            border: "2px dashed #cbd5e1",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>📦</span>
          <h3 style={{ margin: "0.5rem 0", color: "#334155" }}>No Active Delivery Right Now</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            When you accept an assigned order, your active delivery details will appear here.
          </p>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "1rem",
        }}
      >
        <div style={statCardStyle("#e0f2fe", "#0369a1")}>
          <span style={{ fontSize: "1.5rem" }}>📥</span>
          <h4 style={{ margin: "0.25rem 0", fontSize: "1.4rem", color: "#0369a1" }}>{stats?.assigned || 0}</h4>
          <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: "600" }}>Assigned</span>
        </div>

        <div style={statCardStyle("#fef3c7", "#b45309")}>
          <span style={{ fontSize: "1.5rem" }}>✅</span>
          <h4 style={{ margin: "0.25rem 0", fontSize: "1.4rem", color: "#b45309" }}>{stats?.accepted || 0}</h4>
          <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: "600" }}>Accepted</span>
        </div>

        <div style={statCardStyle("#e0e7ff", "#4338ca")}>
          <span style={{ fontSize: "1.5rem" }}>🚚</span>
          <h4 style={{ margin: "0.25rem 0", fontSize: "1.4rem", color: "#4338ca" }}>{stats?.inDelivery || 0}</h4>
          <span style={{ fontSize: "0.8rem", color: "#4f46e5", fontWeight: "600" }}>In Delivery</span>
        </div>

        <div style={statCardStyle("#dcfce7", "#15803d")}>
          <span style={{ fontSize: "1.5rem" }}>🏆</span>
          <h4 style={{ margin: "0.25rem 0", fontSize: "1.4rem", color: "#15803d" }}>{stats?.completed || 0}</h4>
          <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: "600" }}>Completed</span>
        </div>
      </div>

      {/* Assigned Orders Quick Access */}
      <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Pending Assignments</h3>
          <Link to="/driver/orders" style={{ color: "#0284c7", fontWeight: "600", textDecoration: "none", fontSize: "0.9rem" }}>
            View All ({assignedOrders?.length || 0}) →
          </Link>
        </div>

        {assignedOrders && assignedOrders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {assignedOrders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ color: "#0284c7" }}>{order.orderNumber}</strong>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#475569" }}>
                    👤 {order.customer?.user?.fullName} | 📍 {order.deliveryAddress}
                  </p>
                </div>
                <Link
                  to="/driver/orders"
                  style={{
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: "600",
                    fontSize: "0.8rem",
                  }}
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8", textAlign: "center", margin: "1rem 0" }}>No pending assignments currently.</p>
        )}
      </div>
    </div>
  );
}

function statCardStyle(bgColor, textColor) {
  return {
    backgroundColor: bgColor,
    padding: "1rem",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  };
}
