import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function DriverOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [rejectingOrder, setRejectingOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignedOrders = async () => {
    try {
      const res = await api.get("/drivers/orders");
      setOrders(res.data || []);
    } catch (error) {
      toast.error("Failed to load assigned orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
  }, []);

  const handleAccept = async (orderId) => {
    try {
      await api.post(`/drivers/orders/${orderId}/accept`);
      toast.success("Order accepted!");
      fetchAssignedOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to accept order");
    }
  };

  const handleStartDelivery = async (orderId) => {
    try {
      await api.post(`/drivers/orders/${orderId}/start-delivery`);
      toast.success("Delivery started! (Status: IN_DELIVERY / On the way)");
      navigate("/driver/active");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start delivery");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      return toast.error("Please provide a reason for rejection");
    }

    setSubmitting(true);
    try {
      await api.post(`/drivers/orders/${rejectingOrder.id}/reject`, {
        reason: rejectionReason,
      });
      toast.success("Order rejected");
      setRejectingOrder(null);
      setRejectionReason("");
      fetchAssignedOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Loading assigned orders...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>
        📦 Assigned Deliveries ({orders.length})
      </h2>

      {orders.length === 0 ? (
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
          <span style={{ fontSize: "3rem" }}>📭</span>
          <h3 style={{ color: "#334155", margin: "0.5rem 0" }}>No Assigned Orders</h3>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>
            You currently have no new water delivery assignments. New orders assigned by Admin will appear here.
          </p>
        </div>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "1.25rem",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
              borderLeft: order.status === "ACCEPTED" ? "6px solid #0284c7" : "6px solid #f59e0b",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "#0284c7" }}>
                {order.orderNumber}
              </span>
              <span
                style={{
                  backgroundColor: order.status === "ACCEPTED" ? "#e0f2fe" : "#fef3c7",
                  color: order.status === "ACCEPTED" ? "#0369a1" : "#b45309",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "20px",
                  fontSize: "0.8rem",
                  fontWeight: "700",
                }}
              >
                STATUS: {order.status}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                👤 <strong>Customer:</strong> {order.customer?.user?.fullName}
              </div>
              <div style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                📞 <strong>Phone:</strong>{" "}
                <a href={`tel:${order.customer?.user?.phone}`} style={{ color: "#0284c7", fontWeight: "600" }}>
                  {order.customer?.user?.phone}
                </a>
              </div>
              <div style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                📍 <strong>Delivery Address:</strong> {order.deliveryAddress}
              </div>
              <div style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                💧 <strong>Water Product:</strong> {order.product?.name} (Quantity Requested: <strong>{order.requestedQuantity}</strong>)
              </div>
              {order.deliveryNotes && (
                <div style={{ fontSize: "0.9rem", color: "#64748b", fontStyle: "italic", backgroundColor: "#f8fafc", padding: "0.5rem", borderRadius: "8px" }}>
                  📝 Notes: {order.deliveryNotes}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {order.status === "ASSIGNED" && (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => handleAccept(order.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  ✅ Accept Order
                </button>
                <button
                  onClick={() => setRejectingOrder(order)}
                  style={{
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.75rem 1.25rem",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  ❌ Reject
                </button>
              </div>
            )}

            {order.status === "ACCEPTED" && (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => handleStartDelivery(order.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                  }}
                >
                  🚚 Start Delivery (Waa si wadaa / On the way)
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* Reject Modal */}
      {rejectingOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 100,
          }}
        >
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", maxWidth: "450px", width: "100%" }}>
            <h3 style={{ margin: "0 0 1rem 0", color: "#991b1b" }}>
              Reject Order {rejectingOrder.orderNumber}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#475569" }}>
              Please enter the reason for rejecting this assignment. Admin will be notified to reassign.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Vehicle issue, location out of reach..."
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                marginBottom: "1rem",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => setRejectingOrder(null)}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #94a3b8", backgroundColor: "#fff" }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontWeight: "700" }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
