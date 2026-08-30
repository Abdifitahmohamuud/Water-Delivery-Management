import express from "express";
import {
  getAdminDashboard,
  getAllOrders,
  assignDriver,
  reassignDriver,
  updateOrderQuantityAdmin,
  getProducts,
  createProduct,
  updateProduct,
  getDrivers,
  deactivateDriver,
  getCustomers,
  createCustomerAdmin,
  updateCustomerAdmin,
  deleteCustomerAdmin,
  getReports,
} from "../controllers/admin.controller.js";
import { authenticate, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication
router.use(authenticate);
router.use(adminOnly);

// ===================== DASHBOARD =====================
router.get("/dashboard", getAdminDashboard);

// ===================== ORDERS =====================
router.get("/orders", getAllOrders);
router.post("/orders/:orderId/assign-driver", assignDriver);
router.post("/orders/:orderId/reassign-driver", reassignDriver);
router.put("/orders/:orderId/quantity", updateOrderQuantityAdmin);

// ===================== PRODUCTS =====================
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:productId", updateProduct);

// ===================== DRIVERS =====================
router.get("/drivers", getDrivers);
router.post("/drivers/:driverId/deactivate", deactivateDriver);

// ===================== CUSTOMERS =====================
router.get("/customers", getCustomers);
router.post("/customers", createCustomerAdmin);
router.put("/customers/:customerId", updateCustomerAdmin);
router.delete("/customers/:customerId", deleteCustomerAdmin);

// ===================== REPORTS =====================
router.get("/reports", getReports);

export default router;
