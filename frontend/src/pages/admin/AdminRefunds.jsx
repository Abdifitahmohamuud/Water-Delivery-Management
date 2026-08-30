import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { FiLoader, FiX } from "react-icons/fi";

const AdminRefunds = () => {
  const queryClient = useQueryClient();

  const [confirmingRefund, setConfirmingRefund] = useState(null);
  const [confirmAmount, setConfirmAmount] = useState("");
  const [confirmRefundType, setConfirmRefundType] = useState("FULL");
  const [confirmReason, setConfirmReason] = useState("");

  const { data: refunds, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const { data } = await api.get("/refunds");
      return data;
    },
    refetchInterval: 15000,
  });

  const confirmRefundMutation = useMutation({
    mutationFn: ({ id, payload }) => api.patch(`/refunds/${id}/confirm`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-refunds"]);
      queryClient.invalidateQueries(["admin-orders"]);
      toast.success("Dispute refund processed successfully!");
      setConfirmingRefund(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to process refund");
    },
  });

  const handleOpenConfirmModal = (refund) => {
    setConfirmingRefund(refund);
    setConfirmAmount(refund.amount);
    setConfirmRefundType(refund.refundType || "FULL");
    setConfirmReason(refund.reason || "");
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!confirmingRefund) return;

    confirmRefundMutation.mutate({
      id: confirmingRefund.id,
      payload: {
        refundedNow: true,
        amount: parseFloat(confirmAmount),
        refundType: confirmRefundType,
        reason: confirmReason,
      },
    });
  };

  const pendingCount = refunds?.filter((r) => r.status === "PENDING")?.length || 0;

  return (
    <div className="space-y-8 text-left pb-16 transition-colors duration-300">
      <div>
        <h1 className="text-3xl font-black font-heading text-[color:var(--text-main)]">
          Disputes & Refund Management
        </h1>
        <p className="text-[color:var(--text-muted)] text-sm mt-1">
          Review farmer complaints (wrong delivery, uncertified products, damaged tools) and process refund payouts.
        </p>
      </div>

      {pendingCount > 0 && (
        <div className="bg-[color:var(--primary)]/10 p-4 flex items-start gap-3 shadow-sm">
          <span className="text-xl">⏳</span>
          <div>
            <p className="text-[color:var(--primary)] font-bold text-sm">{pendingCount} refund request(s) awaiting action</p>
            <p className="text-[color:var(--text-muted)] text-xs">Process them below to close out the dispute.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-[color:var(--text-muted)]">
          <FiLoader className="text-3xl animate-spin text-[color:var(--primary)]" />
        </div>
      ) : !refunds || refunds.length === 0 ? (
        <div className="bg-[color:var(--bg-card-solid)] p-20 text-center text-[color:var(--text-muted)] italic shadow-sm">
          💸 No active dispute refund requests found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {refunds.map((r) => (
            <div
              key={r.id}
              className="bg-[color:var(--bg-card-solid)] shadow-md hover:shadow-xl transition-all duration-300 p-5 flex flex-col gap-4"
            >
              {/* Header: order id + status */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[color:var(--text-muted)] font-bold">Order</p>
                  <p className="font-mono font-black text-[color:var(--text-main)] text-sm">#{r.orderId?.slice(0, 10)}</p>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-black uppercase ${
                    r.status === "REFUNDED"
                      ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                      : "bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {r.status === "REFUNDED" ? "✅ " : "⏳ "}
                  {r.status}
                </span>
              </div>

              {/* Farmer */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--text-muted)] font-bold">🧑‍🌾 Farmer Account</p>
                <p className="text-[color:var(--text-main)] font-bold text-sm mt-0.5">{r.order?.user?.name || "Farmer"}</p>
              </div>

              {/* Reason */}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[color:var(--text-muted)] font-bold">📝 Dispute Reason</p>
                <p className="text-[color:var(--text-muted)] text-xs mt-0.5 line-clamp-2 italic">{r.reason || "Dispute request"}</p>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[color:var(--text-muted)] font-bold">💰 Refund Amount</p>
                  <p className="font-black text-[color:var(--primary)] text-lg mt-0.5">${r.amount}</p>
                </div>

                {r.status === "PENDING" ? (
                  <button
                    onClick={() => handleOpenConfirmModal(r)}
                    className="px-4 py-2.5 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-black text-[10px] uppercase tracking-wider shadow-md transition-all"
                  >
                    ⚡ Process Refund
                  </button>
                ) : (
                  <span className="text-[10px] text-[color:var(--primary)] font-bold">✅ Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Refund Modal */}
      {confirmingRefund && (
        <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[color:var(--bg-card-solid)] p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-black font-heading text-[color:var(--text-main)]">
                💸 Process Farmer Refund
              </h3>
              <button onClick={() => setConfirmingRefund(null)} className="p-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]">
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                  Refund Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.value)}
                  required
                  className="w-full bg-[color:var(--surface-soft)] px-4 py-3 text-xs text-[color:var(--text-main)] font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                  Resolution Reason
                </label>
                <textarea
                  rows="3"
                  value={confirmReason}
                  onChange={(e) => setConfirmReason(e.target.value)}
                  className="w-full bg-[color:var(--surface-soft)] p-3 text-xs text-[color:var(--text-main)] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={confirmRefundMutation.isPending}
                className="w-full py-3.5 bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-black text-xs uppercase tracking-widest shadow-md transition-all"
              >
                {confirmRefundMutation.isPending ? "Confirming..." : "Approve & Confirm Refund"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;