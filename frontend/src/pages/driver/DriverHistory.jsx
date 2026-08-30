import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function DriverHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/drivers/deliveries/completed");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.deliveries)
        ? res.data.deliveries
        : [];
      setDeliveries(list);
    } catch (error) {
      toast.error("Failed to load delivery history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Loading delivery history...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
        📋 Completed Delivery History ({deliveries.length})
      </h2>

      {deliveries.length === 0 ? (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "3rem 1.5rem",
            borderRadius: "16px",
            textAlign: "center",
            color: "#64748b",
            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          }}
        >
          <span style={{ fontSize: "3rem" }}>🏆</span>
          <h3 style={{ color: "#334155", margin: "0.5rem 0" }}>No Completed Deliveries Yet</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            Deliveries you complete will be permanently recorded here for your history and stats.
          </p>
        </div>
      ) : (
        deliveries.map((delivery) => (
          <div
            key={delivery.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "1.25rem",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
              borderLeft: "6px solid #16a34a",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontWeight: "700", fontSize: "1.05rem", color: "#0284c7" }}>
                {delivery.orderNumber}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>
                🕒 {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : "Delivered"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.95rem" }}>
              <div>👤 <strong>Customer:</strong> {delivery.customer?.user?.fullName}</div>
              <div>📍 <strong>Address:</strong> {delivery.deliveryAddress}</div>
              <div>💧 <strong>Product:</strong> {delivery.product?.name}</div>
              <div style={{ display: "flex", gap: "1rem", backgroundColor: "#f0fdf4", padding: "0.5rem 0.75rem", borderRadius: "8px", marginTop: "0.25rem" }}>
                <span>Requested: <strong>{delivery.requestedQuantity}</strong></span>
                <span style={{ color: "#16a34a" }}>Delivered: <strong>{delivery.deliveredQuantity}</strong></span>
              </div>
              {delivery.deliveryNotes && (
                <div style={{ fontSize: "0.85rem", color: "#475569", fontStyle: "italic", marginTop: "0.25rem" }}>
                  📝 Note: {delivery.deliveryNotes}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
