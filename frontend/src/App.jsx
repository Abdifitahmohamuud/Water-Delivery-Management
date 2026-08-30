import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import useAuthStore from "./store/useAuthStore";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Customer Pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import Support from "./pages/Support";

// Driver Pages
import DriverLayout from "./components/driver/DriverLayout";
import DriverDashboard from "./pages/driver/DriverDashboard";
import DriverOrders from "./pages/driver/DriverOrders";
import DriverActiveDelivery from "./pages/driver/DriverActiveDelivery";
import DriverHistory from "./pages/driver/DriverHistory";
import DriverProfile from "./pages/driver/DriverProfile";

// Admin Pages
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminDrivers from "./pages/admin/AdminDrivers";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminReports from "./pages/admin/AdminReports";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuthStore();

  if (loading) return <div className="p-12 text-center text-slate-500">Loading auth...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" replace />;

  return children;
};

function App() {
  const { checkAuth, loading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
        <div className="h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest font-bold">Initializing Water Delivery System...</p>
      </div>
    );
  }

  return (
    <div className="app-container font-sans">
      <Toaster position="top-right" />
      <Routes>
        {/* Customer & Public Routes (Navbar + Footer) */}
        <Route element={<><Navbar /><main className="content"><Outlet /></main><Footer /></>}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/checkout" element={<ProtectedRoute roleRequired="CUSTOMER"><Checkout /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute roleRequired="CUSTOMER"><MyOrders /></ProtectedRoute>} />
          <Route path="/order/:id" element={<ProtectedRoute roleRequired="CUSTOMER"><OrderDetail /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute roleRequired="CUSTOMER"><Support /></ProtectedRoute>} />
        </Route>

        {/* Driver Portal Routes */}
        <Route element={<ProtectedRoute roleRequired="DRIVER"><DriverLayout /></ProtectedRoute>}>
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/orders" element={<DriverOrders />} />
          <Route path="/driver/active" element={<DriverActiveDelivery />} />
          <Route path="/driver/history" element={<DriverHistory />} />
          <Route path="/driver/profile" element={<DriverProfile />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route element={<ProtectedRoute roleRequired="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/drivers" element={<AdminDrivers />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
