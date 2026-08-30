import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import {
  FiShoppingBag,
  FiUser,
  FiRefreshCw,
  FiCheckCircle,
  FiLoader,
  FiAlertCircle,
  FiTrash2,
  FiPlus,
  FiX,
  FiEye,
  FiDollarSign,
} from "react-icons/fi";

/**
 * NOTE ON ASSUMED ENDPOINTS
 * Admin's full CRUD hits /orders, /orders/:id/status, /orders/:id/resolve,
 * /orders/:id (DELETE), /orders/:id/cancel, /refunds/:id/confirm — all
 * unscoped, because an admin can touch every order.
 *
 * A supplier must only ever touch orders/items that belong to them, so this
 * file assumes a parallel, supplier-scoped API surface:
 *   GET   /supplier/orders
 *   GET   /supplier/products
 *   POST  /supplier/orders
 *   PUT   /supplier/orders/:id/status
 *   PUT   /supplier/orders/:id/resolve
 *   DELETE /supplier/orders/:id
 *   POST  /supplier/orders/:id/cancel
 *   PATCH /supplier/refunds/:id/confirm
 * Swap these for whatever your backend actually exposes if the names differ.
 */

const SupplierOrders = () => {
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("EVC Plus");
  const [orderItems, setOrderItems] = useState([{ productId: "", quantity: 1, price: 0 }]);

  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefundedNow, setCancelRefundedNow] = useState(true);
  const [cancelAmount, setCancelAmount] = useState("");

  const [confirmRefundModal, setConfirmRefundModal] = useState(null);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["supplier-orders"],
    queryFn: async () => {
      const { data } = await api.get("/supplier/orders");
      return data;
    },
    refetchInterval: 30000,
  });

  const { data: products } = useQuery({
    queryKey: ["supplier-products-list"],
    queryFn: async () => {
      const { data } = await api.get("/supplier/products");
      return data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (data) => api.post("/supplier/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-orders"]);
      toast.success("Order recorded successfully!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to create order");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/supplier/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-orders"]);
      queryClient.invalidateQueries(["supplier-dashboard"]);
      toast.success("Order status updated!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to update order status");
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: ({ id, resolution }) => api.put(`/supplier/orders/${id}/resolve`, { resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-orders"]);
      queryClient.invalidateQueries(["supplier-dashboard"]);
      toast.success("Complaint resolved!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to resolve complaint");
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id) => api.delete(`/supplier/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-orders"]);
      toast.success("Order deleted successfully!");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to delete order");
    },
  });

  const cancelOrderWithRefundMutation = useMutation({
    mutationFn: ({ id, payload }) => api.post(`/supplier/orders/${id}/cancel`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-orders"]);
      queryClient.invalidateQueries(["supplier-dashboard"]);
      queryClient.invalidateQueries(["supplier-refunds"]);
      toast.success("Order cancelled and refund logged successfully!");
      setCancelModalOrder(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to cancel order");
    },
  });

  const confirmRefundMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/supplier/refunds/${id}/confirm`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-orders"]);
      queryClient.invalidateQueries(["supplier-dashboard"]);
      queryClient.invalidateQueries(["supplier-refunds"]);
      toast.success("Refund confirmed!");
      setConfirmRefundModal(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to confirm refund");
    },
  });

  const handleStatusChange = (order, newStatus) => {
    if (newStatus === "CANCELLED") {
      setCancelModalOrder(order);
      setCancelReason("");
      setCancelRefundedNow(true);
      setCancelAmount(order.totalAmount);
      return;
    }
    updateStatusMutation.mutate({ id: order.id, status: newStatus });
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerContact("");
    setShippingAddress("");
    setComment("");
    setPaymentMethod("EVC Plus");
    setOrderItems([{ productId: "", quantity: 1, price: 0 }]);
  };

  const handleAddProductRow = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveProductRow = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, productId) => {
    const product = products?.find((p) => p.id === productId);
    const updated = [...orderItems];
    updated[index] = {
      productId,
      quantity: updated[index].quantity,
      price: product ? product.price : 0,
    };
    setOrderItems(updated);
  };

  const handleQuantityChange = (index, qty) => {
    const updated = [...orderItems];
    updated[index].quantity = parseInt(qty) || 1;
    setOrderItems(updated);
  };

  const handleManualOrderSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter the customer's name");
      return;
    }
    const validItems = orderItems.filter((item) => item.productId !== "");
    if (validItems.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    const totalAmount = validItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    createOrderMutation.mutate({
      customerName,
      customerContact,
      shippingAddress,
      totalAmount,
      paymentMethod,
      comment,
      items: validItems,
      isOffline: true,
    });
  };

  const pendingComplaints = orders?.filter((o) => o.complaintStatus === "PENDING")?.length || 0;
  const statusTone = (status) => {
    if (status === "DELIVERED") return "text-[color:var(--primary)] bg-emerald-50 dark:bg-emerald-500/10";
    if (status === "CANCELLED" || status === "RETURNED") return "text-red-600 bg-red-50 dark:bg-red-500/10";
    if (status === "PENDING") return "text-[color:var(--primary)] bg-emerald-50 dark:bg-emerald-500/10";
    return "text-[color:var(--text-main)] bg-[color:var(--surface-soft)]";
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-bold">Loading Orders...</p>
      </div>
    );

  return (
    <div className="space-y-7 text-left pb-16 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-heading text-[color:var(--text-main)]">
            Received Farmer Orders
          </h1>
          <p className="text-[color:var(--text-muted)] text-sm mt-1">
            Fulfill incoming customer orders for your listed seeds, fertilizers, and farm equipment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[color:var(--primary)] text-white px-5 py-2.5 font-black text-sm hover:bg-[color:var(--primary-hover)] transition-all shadow-lg shadow-emerald-900/10"
          >
            <FiPlus /> Log Order
          </button>
          <button
            onClick={() => queryClient.invalidateQueries(["supplier-orders"])}
            className="flex items-center gap-2 px-4 py-2.5 bg-[color:var(--surface-soft)] border border-[color:var(--border-color)] hover:border-[color:var(--primary)] text-[color:var(--text-main)] transition-all font-bold text-sm"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Pending Complaints Alert */}
      {pendingComplaints > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-2xl flex items-start gap-3">
          <FiAlertCircle className="text-red-500 text-xl mt-1 flex-shrink-0" />
          <div>
            <p className="text-red-600 dark:text-red-400 font-bold">
              {pendingComplaints} pending complaint(s) need attention
            </p>
            <p className="text-red-500/70 dark:text-red-300/70 text-sm">Review the flagged orders below</p>
          </div>
        </div>
      )}

      {error ? (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-8 rounded-3xl text-center text-red-500">
          <FiAlertCircle className="text-3xl mx-auto mb-3" />
          Failed to load orders. Please try again.
        </div>
      ) : (
        <div className="grid gap-6">
          {orders?.map((order) => (
            <div
              key={order.id}
              className="border border-[color:var(--border-color)] bg-[color:var(--bg-card-solid)] p-6 sm:p-7 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[color:var(--border-color)] pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-muted)] block">
                    Order ID #{order.id.slice(0, 10)}
                  </span>
                  <p className="text-base font-extrabold text-[color:var(--text-main)] flex items-center gap-2 mt-0.5">
                    <FiUser className="text-[color:var(--primary)]" /> {order.user?.name || "Farmer Customer"}
                  </p>
                  <p className="text-xs text-slate-400">{order.user?.phoneNumber || order.user?.email || "No contact info"}</p>
                </div>
                <div className="sm:text-right">
                  <select
                    className={`border border-[color:var(--border-color)] px-3 py-1.5 text-xs font-black uppercase tracking-wider focus:ring-1 ring-emerald-500 outline-none cursor-pointer transition-all ${statusTone(order.status)}`}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                    disabled={updateStatusMutation.isPending || order.refund?.status === "REFUNDED"}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                  {order.refund?.status === "REFUNDED" && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">Locked (Refunded)</div>
                  )}
                  <p className="text-lg font-black text-[color:var(--primary)] mt-1">
                    ${parseFloat(order.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[color:var(--text-muted)]">Order Items</p>
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item) => (
                    <span
                      key={item.id}
                      className="bg-[color:var(--surface-soft)] px-3 py-1.5 text-xs text-[color:var(--text-main)] font-bold border border-[color:var(--border-color)]"
                    >
                      {item.product?.name} x {item.quantity} (${item.price})
                    </span>
                  ))}
                </div>
              </div>

              {order.comment && (
                <div className="space-y-1.5">
                  <span
                    className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-bold uppercase w-fit ${order.complaintStatus === "RESOLVED"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 animate-pulse"
                      }`}
                  >
                    {order.complaintStatus}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-md">"{order.comment}"</p>
                </div>
              )}

              <div className="pt-2 text-xs text-[color:var(--text-muted)] flex flex-wrap items-center justify-between gap-3">
                <span>Delivery Destination: {order.shippingAddress || "Standard Farm Address"}</span>
                <span className="font-bold text-[color:var(--primary)]">Payment: {order.paymentMethod || "EVC Plus"}</span>
              </div>

              <div className="border-t border-[color:var(--border-color)] pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--text-muted)]">Order transactions</p>
                  {order.status === "CANCELLED" && <span className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Cancelled order</span>}
                </div>
                {order.transactions?.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {order.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between gap-3 border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-3 py-2 text-xs">
                        <span className="font-black text-[color:var(--primary)]">{transaction.type}</span>
                        <span className="font-bold text-[color:var(--text-main)]">${Number(transaction.amount || 0).toFixed(2)}</span>
                        <span className="text-[color:var(--text-muted)]">{transaction.status}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-[color:var(--text-muted)]">No transactions recorded for this order.</p>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-[color:var(--border-color)]">
                <button
                  onClick={() => setViewingOrder(order)}
                  className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-[color:var(--primary)] px-3 py-1.5 text-xs font-bold hover:opacity-80 transition-all"
                  title="View Payment Details"
                >
                  <FiEye size={12} /> View
                </button>

                {order.status === "CANCELLED" && order.refund?.status === "PENDING" && (
                  <button
                    onClick={() => {
                      setConfirmRefundModal(order.refund);
                      setCancelAmount(order.refund.amount);
                      setCancelReason(order.refund.reason || "");
                      setCancelRefundedNow(true);
                    }}
                    className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-all flex items-center gap-1"
                    title="Confirm Money Returned to Customer"
                  >
                    <FiDollarSign size={12} /> Money Returned
                  </button>
                )}

                {order.comment && order.complaintStatus === "PENDING" && (
                  <>
                    <button
                      onClick={() => resolveComplaintMutation.mutate({ id: order.id, resolution: "REFUND" })}
                      disabled={resolveComplaintMutation.isPending}
                      className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {resolveComplaintMutation.isPending ? <FiLoader className="animate-spin" size={12} /> : <FiRefreshCw size={12} />}
                      Refund
                    </button>
                    <button
                      onClick={() => resolveComplaintMutation.mutate({ id: order.id, resolution: "REPLACE" })}
                      disabled={resolveComplaintMutation.isPending}
                      className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-80 transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {resolveComplaintMutation.isPending ? <FiLoader className="animate-spin" size={12} /> : <FiCheckCircle size={12} />}
                      Replace
                    </button>
                  </>
                )}

                <button
                  onClick={() => window.confirm("Delete this order?") && deleteOrderMutation.mutate(order.id)}
                  disabled={deleteOrderMutation.isPending}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all ml-auto"
                  title="Delete Order"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {(!orders || orders.length === 0) && (
            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-400 space-y-3">
              <FiShoppingBag className="text-4xl mx-auto text-slate-300" />
              <p className="text-sm font-extrabold">No Received Orders Yet</p>
              <p className="text-xs">Once farmers order your listed inputs, they will appear here for fulfillment.</p>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[2000] p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Order Details</h3>
                <p className="text-slate-400 text-sm mt-1">#{viewingOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 space-y-3">
                <h4 className="text-emerald-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest mb-4">
                  Order Summary
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-400">Customer:</span>
                    <p className="text-slate-900 dark:text-white font-bold mt-0.5">{viewingOrder.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Contact:</span>
                    <p className="text-slate-900 dark:text-white font-bold mt-0.5">
                      {viewingOrder.user?.phoneNumber || viewingOrder.user?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Amount:</span>
                    <p className="text-emerald-600 dark:text-amber-400 font-black text-lg mt-0.5">
                      ${parseFloat(viewingOrder.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <p className="text-slate-900 dark:text-white font-bold mt-0.5">{viewingOrder.status}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment Method:</span>
                    <p className="text-slate-900 dark:text-white font-bold mt-0.5">{viewingOrder.paymentMethod || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment Status:</span>
                    <p
                      className={`font-black mt-0.5 ${["PAID", "FULLY_PAID", "DEPOSIT_PAID"].includes(viewingOrder.paymentStatus)
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                        }`}
                    >
                      {viewingOrder.paymentStatus}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Shipping Address:</span>
                    <p className="text-slate-900 dark:text-white font-bold mt-0.5">{viewingOrder.shippingAddress || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Placed On:</span>
                    <p className="text-slate-900 dark:text-white font-bold mt-0.5">
                      {new Date(viewingOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 space-y-4">
                <h4 className="text-emerald-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest">
                  Ordered Items
                </h4>
                {viewingOrder.items?.length > 0 ? (
                  <div className="space-y-3">
                    {viewingOrder.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 bg-white dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-xl text-xs"
                      >
                        <p className="text-slate-900 dark:text-white font-bold text-sm">
                          {item.product?.name || "Agricultural Item"}
                        </p>
                        <div className="text-right">
                          <p className="text-slate-700 dark:text-white font-bold">
                            {item.quantity} x ${item.price}
                          </p>
                          <p className="text-emerald-600 dark:text-emerald-400 font-black text-xs mt-0.5">
                            ${(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs italic">No line items recorded for this order.</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setViewingOrder(null)}
                className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold rounded-xl hover:opacity-80 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[2000] p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Log a Farmer Order</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleManualOrderSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Customer Name</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="E.g. Xasan Farmer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Phone / Email</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="E.g. 06xxxxxxxx"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Delivery Address</label>
                <textarea
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[80px]"
                  placeholder="E.g. Farm Road, Afgooye"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Payment Method</label>
                  <select
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="EVC Plus">EVC Plus</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Note / Comment</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="E.g. Deliver before noon"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Order Items</label>
                  <button
                    type="button"
                    onClick={handleAddProductRow}
                    className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg hover:opacity-80 font-bold transition-all"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-end bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5"
                    >
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Product</label>
                        <select
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-none rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-1 ring-emerald-500 outline-none"
                          value={item.productId}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          required
                        >
                          <option value="" disabled>
                            Select Product
                          </option>
                          {products?.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.price})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24 space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Qty</label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-none rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-1 ring-emerald-500 outline-none"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          required
                        />
                      </div>

                      <div className="w-24 space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Price</label>
                        <div className="w-full bg-white dark:bg-white/5 py-2 px-3 rounded-lg text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 text-center font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProductRow(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all self-center"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-widest block">Total Order Value</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-amber-400">
                    ${orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="bg-emerald-600 dark:bg-amber-500 text-white dark:text-black font-black px-8 py-3 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <FiLoader className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Log Order"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[3000] p-6">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-red-200 dark:border-red-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Cancel Order #{cancelModalOrder.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Specify cancellation reason and refund processing option.</p>
              </div>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(cancelAmount);
                if (cancelRefundedNow && (isNaN(amt) || amt <= 0)) {
                  toast.error("Lacagta la celinayo waa in ay ka badnaataa eber ($0) mar haddii la xaqiijiyay in lacagtii la celiyay.");
                  return;
                }
                cancelOrderWithRefundMutation.mutate({
                  id: cancelModalOrder.id,
                  payload: { reason: cancelReason, refundedNow: cancelRefundedNow, amount: amt },
                });
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Reason for Cancellation *</label>
                <textarea
                  required
                  placeholder="E.g. Out of stock / Customer requested cancellation"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Refund Customer Now?</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="cancelRefundedNow"
                      checked={cancelRefundedNow === true}
                      onChange={() => setCancelRefundedNow(true)}
                      className="accent-emerald-600"
                    />
                    Yes (Confirmed Refunded)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="cancelRefundedNow"
                      checked={cancelRefundedNow === false}
                      onChange={() => setCancelRefundedNow(false)}
                      className="accent-emerald-600"
                    />
                    No (Mark Pending)
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Refund Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cancelAmount}
                  onChange={(e) => setCancelAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:opacity-80 transition-all text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelOrderWithRefundMutation.isPending}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {cancelOrderWithRefundMutation.isPending ? <FiLoader className="animate-spin" /> : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Money Returned Modal */}
      {confirmRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[3000] p-6">
          <div className="w-full max-w-md bg-white dark:bg-[#0f172a] border border-emerald-200 dark:border-emerald-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Money Returned</h3>
                <p className="text-slate-400 text-xs mt-0.5">Confirm customer refund payment receipt.</p>
              </div>
              <button
                onClick={() => setConfirmRefundModal(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-slate-400"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = parseFloat(cancelAmount);
                if (cancelRefundedNow && (isNaN(amt) || amt <= 0)) {
                  toast.error("Lacagta la celinayo waa in ay ka badnaataa eber ($0) mar haddii la xaqiijiyay in lacagtii la celiyay.");
                  return;
                }
                confirmRefundMutation.mutate({
                  id: confirmRefundModal.id,
                  payload: { refundedNow: cancelRefundedNow, amount: amt, reason: cancelReason },
                });
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Has money been returned to customer?
                </label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="confirmRefundedNow"
                      checked={cancelRefundedNow === true}
                      onChange={() => setCancelRefundedNow(true)}
                      className="accent-emerald-600"
                    />
                    Yes (Confirm REFUNDED)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="confirmRefundedNow"
                      checked={cancelRefundedNow === false}
                      onChange={() => setCancelRefundedNow(false)}
                      className="accent-emerald-600"
                    />
                    No (Keep PENDING)
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cancelAmount}
                  onChange={(e) => setCancelAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all min-h-[70px]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setConfirmRefundModal(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:opacity-80 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmRefundMutation.isPending}
                  className="flex-1 py-3 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {confirmRefundMutation.isPending ? <FiLoader className="animate-spin" /> : "Save Refund Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierOrders;