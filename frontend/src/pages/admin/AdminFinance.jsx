import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import useAutoRefresh from "../../hooks/useAutoRefresh";

export default function AdminFinance() {
  const [summary, setSummary] = useState(null);
  const [customerBalances, setCustomerBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settlement Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchFinanceData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [sumRes, balRes, txRes] = await Promise.all([
        api.get("/finance/summary"),
        api.get("/finance/customer-balances"),
        api.get("/finance/transactions"),
      ]);

      setSummary(sumRes.data);
      setCustomerBalances(balRes.data || []);
      setTransactions(txRes.data || []);
    } catch (error) {
      if (!silent) toast.error("Failed to load financial records");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const streamRefresh = useCallback(() => {
    fetchFinanceData(true);
  }, []);

  useAutoRefresh(streamRefresh, 4000);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const openSettleModal = (customerId = "") => {
    setSelectedCustomerId(customerId);
    setSettlementAmount("");
    setNotes("");
    setModalOpen(true);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return toast.error("Please select a customer");
    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Please enter a valid payment amount");

    setSubmitting(true);
    try {
      const res = await api.post("/finance/settle", {
        customerId: selectedCustomerId,
        paymentAmount: amount,
        paymentMethod,
        notes,
      });

      toast.success(res.data.message || "Payment settled & allocated successfully!");
      setModalOpen(false);
      fetchFinanceData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to settle payment");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomerInfo = customerBalances.find((c) => c.customerId === selectedCustomerId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Finance & Debt Management 💰</h1>
          <p className="text-xs text-slate-500 mt-1">Track outstanding customer receivables, credit balances, and FIFO debt settlements</p>
        </div>

        <button
          onClick={() => openSettleModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-sm transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
        >
          💳 Settle Customer Debt / Receive Payment
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outstanding Debt</span>
          <div className="text-3xl font-black text-rose-600">
            ${summary?.totalOutstandingDebt?.toFixed(2) || "0.00"}
          </div>
          <p className="text-[11px] text-slate-500">{summary?.unpaidOrdersCount || 0} unpaid/partially paid orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue Collected</span>
          <div className="text-3xl font-black text-emerald-600">
            ${summary?.totalCollected?.toFixed(2) || "0.00"}
          </div>
          <p className="text-[11px] text-slate-500">Collected from settled payments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Order Revenue</span>
          <div className="text-3xl font-black text-cyan-600">
            ${summary?.totalRevenueExpected?.toFixed(2) || "0.00"}
          </div>
          <p className="text-[11px] text-slate-500">Across {summary?.totalOrdersCount || 0} total water orders</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Debt Accounts</span>
          <div className="text-3xl font-black text-amber-500">
            {customerBalances.filter((c) => c.totalDebt > 0).length}
          </div>
          <p className="text-[11px] text-slate-500">Customers with unpaid balances</p>
        </div>
      </div>

      {/* Customer Receivables Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Credit & Outstanding Receivables</h3>
          <span className="text-xs text-slate-500 font-semibold">{customerBalances.length} customers listed</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading financial records...</div>
        ) : customerBalances.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No customer credit balances found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total Ordered</th>
                  <th className="p-4">Total Paid</th>
                  <th className="p-4">Current Outstanding Debt</th>
                  <th className="p-4">Unpaid Orders</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customerBalances.map((c) => (
                  <tr key={c.customerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{c.customerName}</div>
                      <div className="text-xs text-slate-400">📞 {c.phone}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">${c.totalOrdered.toFixed(2)}</td>
                    <td className="p-4 font-bold text-emerald-600">${c.totalPaid.toFixed(2)}</td>
                    <td className="p-4 font-black text-rose-600">
                      ${c.totalDebt.toFixed(2)}
                      {c.totalDebt === 0 && <span className="ml-2 text-xs font-bold text-emerald-600">Clear</span>}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500">{c.unpaidOrdersCount} orders</td>
                    <td className="p-4 text-right">
                      {c.totalDebt > 0 ? (
                        <button
                          onClick={() => openSettleModal(c.customerId)}
                          className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold px-3.5 py-2 rounded-xl text-xs transition"
                        >
                          Settle Debt
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">No Debt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Transactions Log */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Debt Payment Transactions</h3>
        {transactions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">No debt payment transactions recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      👤 {tx.customer?.user?.fullName || "Customer"}
                    </span>
                    <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded text-slate-600">
                      {tx.paymentMethod}
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-600">+${tx.amount.toFixed(2)}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Date: {new Date(tx.createdAt).toLocaleString()} {tx.notes && `| Notes: ${tx.notes}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Receive & Settle Payment</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Customer *</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="">-- Choose Customer --</option>
                  {customerBalances.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.customerName} (${c.totalDebt.toFixed(2)} Debt)
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomerInfo && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Total Outstanding Debt:</span><span className="font-bold text-rose-600">${selectedCustomerInfo.totalDebt.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Unpaid Orders:</span><span className="font-bold">{selectedCustomerInfo.unpaidOrdersCount}</span></div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Settlement Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder="E.g., 75.00"
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-black"
                />
                <p className="text-[11px] text-slate-400 mt-1">Payment will automatically be applied to oldest unpaid orders (FIFO).</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                >
                  <option value="CASH">CASH</option>
                  <option value="MOBILE_MONEY">MOBILE MONEY</option>
                  <option value="BANK">BANK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. Reciept #1042 or Zaad ref..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-600/30"
              >
                {submitting ? "Processing Settlement..." : "Confirm & Apply Payment Settlement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}