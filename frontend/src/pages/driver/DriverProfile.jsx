import { useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import toast from "react-hot-toast";

export default function DriverProfile() {
  const { user, changePassword } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // toast shown in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Profile Card */}
      <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#0f172a", margin: "0 0 1rem 0" }}>
          👤 Driver Profile
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Full Name</span>
            <p style={{ margin: "0.2rem 0", fontWeight: "700", color: "#1e293b" }}>{user?.fullName}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Phone Number</span>
            <p style={{ margin: "0.2rem 0", fontWeight: "700", color: "#1e293b" }}>{user?.phone}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Email Address</span>
            <p style={{ margin: "0.2rem 0", fontWeight: "700", color: "#1e293b" }}>{user?.email}</p>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Vehicle Info</span>
            <p style={{ margin: "0.2rem 0", fontWeight: "700", color: "#1e293b" }}>
              {user?.driver?.vehicleNumber ? `${user?.driver?.vehicleType || 'Vehicle'} (${user?.driver?.vehicleNumber})` : "Standard Delivery Vehicle"}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 1rem 0" }}>
          🔒 Change Password
        </h3>

        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.3rem" }}>Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.3rem" }}>New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.3rem" }}>Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: "#0284c7",
              color: "#ffffff",
              border: "none",
              padding: "0.85rem",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
