import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function DriverActiveDelivery() {
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);

  // Delivery Completion Form
  const [deliveredQuantity, setDeliveredQuantity] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchActiveDelivery = async () => {
    try {
      const res = await api.get("/drivers/dashboard");
      const active = res.data?.activeDelivery;
      setActiveDelivery(active || null);
      if (active) {
        setDeliveredQuantity(active.requestedQuantity || "");
      }
    } catch (error) {
      toast.error("Failed to load active delivery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveDelivery();
  }, []);

  const handleStartDelivery = async () => {
    if (!activeDelivery) return;
    setSubmitting(true);
    try {
      await api.post(`/drivers/orders/${activeDelivery.id}/start-delivery`);
      toast.success("Delivery started! Customer has been notified.");
      fetchActiveDelivery();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start delivery");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteDelivery = async (e) => {
    e.preventDefault();
    if (!deliveredQuantity || parseInt(deliveredQuantity, 10) <= 0) {
      return toast.error("Please enter a valid delivered quantity greater than 0");
    }

    setSubmitting(true);
    try {
      await api.post(`/drivers/orders/${activeDelivery.id}/complete-delivery`, {
        deliveredQuantity: parseInt(deliveredQuantity, 10),
        deliveryNotes,
      });
      toast.success("Delivery completed successfully! Great job!");
      setActiveDelivery(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to complete delivery");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "3rem" }}>Loading active delivery...</div>;
  }

  if (!activeDelivery) {
    return (
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
        <span style={{ fontSize: "3.5rem" }}>🚚</span>
        <h3 style={{ color: "#334155", margin: "0.5rem 0" }}>No Active Delivery</h3>
        <p style={{ margin: 0, fontSize: "0.95rem" }}>
          You do not have an active delivery right now. Accept an assigned order from your <strong>Assigned Orders</strong> tab to begin delivery.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "1.5rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          borderTop: "6px solid #0284c7",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#0284c7", margin: 0 }}>
            {activeDelivery.orderNumber}
          </h2>
          <span
            style={{
              backgroundColor: activeDelivery.status === "IN_DELIVERY" ? "#dcfce7" : "#e0f2fe",
              color: activeDelivery.status === "IN_DELIVERY" ? "#16a34a" : "#0369a1",
              padding: "0.3rem 0.8rem",
              borderRadius: "20px",
              fontSize: "0.85rem",
              fontWeight: "700",
            }}
          >
            {activeDelivery.status === "IN_DELIVERY" ? "🚚 ON THE WAY" : "✅ ACCEPTED"}
          </span>
        </div>

        {/* Customer & Address Details */}
        <div style={{ backgroundColor: "#f8fafc", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem", color: "#0f172a" }}>
            👤 Customer Information
          </h3>
          <p style={{ margin: "0.3rem 0", fontSize: "0.95rem" }}>
            <strong>Name:</strong> {activeDelivery.customer?.user?.fullName}
          </p>
          <p style={{ margin: "0.3rem 0", fontSize: "0.95rem" }}>
            <strong>Phone:</strong>{" "}
            <a href={`tel:${activeDelivery.customer?.user?.phone}`} style={{ color: "#0284c7", fontWeight: "700" }}>
              📞 {activeDelivery.customer?.user?.phone} (Click to Call)
            </a>
          </p>
          <p style={{ margin: "0.3rem 0", fontSize: "0.95rem" }}>
            📍 <strong>Delivery Address:</strong> {activeDelivery.deliveryAddress}
          </p>
        </div>

        {/* Product Details */}
        <div style={{ backgroundColor: "#eff6ff", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem", color: "#1e40af" }}>
            💧 Order Product Details
          </h3>
          <p style={{ margin: "0.3rem 0", fontSize: "0.95rem" }}>
            <strong>Product:</strong> {activeDelivery.product?.name}
          </p>
          <p style={{ margin: "0.3rem 0", fontSize: "0.95rem" }}>
            <strong>Requested Quantity:</strong> <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0284c7" }}>{activeDelivery.requestedQuantity}</span> {activeDelivery.product?.unit || "units"}
          </p>
          <p style={{ margin: "0.3rem 0", fontSize: "0.95rem" }}>
            <strong>Total Amount:</strong> ${activeDelivery.totalPrice}
          </p>
        </div>

        {/* Workflow Actions */}
        {activeDelivery.status === "ACCEPTED" && (
          <div>
            <p style={{ color: "#475569", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Click <strong>Start Delivery</strong> when you are departing to deliver water to the customer.
            </p>
            <button
              onClick={handleStartDelivery}
              disabled={submitting}
              style={{
                width: "100%",
                backgroundColor: "#0284c7",
                color: "#ffffff",
                border: "none",
                padding: "1rem",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
              }}
            >
              🚀 Start Delivery (Notify Customer)
            </button>
          </div>
        )}

        {activeDelivery.status === "IN_DELIVERY" && (
          <form onSubmit={handleCompleteDelivery} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a", padding: "1rem", borderRadius: "10px" }}>
              <span style={{ fontWeight: "700", color: "#854d0e" }}>💡 Business Rule:</span>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#713f12" }}>
                Enter the actual quantity delivered to the customer. It can be equal to, less than, or greater than the requested quantity ({activeDelivery.requestedQuantity}).
              </p>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "700", marginBottom: "0.5rem", color: "#0f172a" }}>
                Actual Delivered Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={deliveredQuantity}
                onChange={(e) => setDeliveredQuantity(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  borderRadius: "10px",
                  border: "2px solid #0284c7",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: "700", marginBottom: "0.5rem", color: "#0f172a" }}>
                Delivery Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="E.g., Delivered 10 containers. Customer paid cash."
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.95rem",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                border: "none",
                padding: "1rem",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "1.1rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
              }}
            >
              🏁 Complete Delivery
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
