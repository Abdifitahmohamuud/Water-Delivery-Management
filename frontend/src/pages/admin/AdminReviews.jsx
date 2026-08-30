import { useState, useEffect } from "react";
import { FiCheckCircle, FiTrash2, FiMessageSquare, FiStar, FiUser, FiPackage, FiBriefcase } from "react-icons/fi";
import toast from "react-hot-toast";
import api from "../../lib/api";

const AdminReviews = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const res = await api.get("/reviews/admin/pending");
      setPendingReviews(res.data);
    } catch (error) {
      console.error("Failed to fetch pending reviews", error);
      toast.error("Failed to load pending reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/reviews/admin/${id}/approve`);
      toast.success("Review approved and published publicly!");
      setPendingReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve review");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pending review?")) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      toast.success("Review deleted");
      setPendingReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  return (
    <div className="p-8 text-left">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[color:var(--text-main)] flex items-center gap-3">
            <FiMessageSquare className="text-emerald-700" /> Pending Review Moderation
          </h1>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">
            Approve or reject customer ratings and reviews before they become visible to the public.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-black uppercase text-amber-800">
          {pendingReviews.length} Pending
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : pendingReviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <FiCheckCircle className="mx-auto text-4xl text-emerald-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-800">All Clear!</h3>
          <p className="text-sm text-gray-500 mt-1">There are no pending reviews requiring moderation right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingReviews.map((rev) => {
            const isProduct = rev.targetType === "PRODUCT" || Boolean(rev.productId);
            const targetName = isProduct
              ? rev.product?.name || "Product"
              : rev.supplier?.supplierBusinessName || rev.supplier?.businessName || rev.supplier?.name || "Supplier";

            return (
              <div
                key={rev.id}
                className="rounded-3xl border border-[color:var(--border-color)] bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        isProduct ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {isProduct ? <FiPackage /> : <FiBriefcase />}
                      {isProduct ? "Product Review" : "Supplier Review"}
                    </span>

                    <span className="font-bold text-sm text-gray-900">
                      Target: <span className="text-emerald-700">{targetName}</span>
                    </span>

                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs ml-auto md:ml-0">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`h-4 w-4 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="ml-1 text-gray-700">({rev.rating}/5)</span>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FiUser className="text-gray-400" />
                      Submitted by: <strong className="text-gray-700">{rev.user?.name}</strong> ({rev.user?.email})
                    </span>
                    <span>•</span>
                    <span>Date: {new Date(rev.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => handleApprove(rev.id)}
                    className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-800 shadow-md shadow-emerald-700/20"
                  >
                    <FiCheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 rounded-2xl bg-red-100 px-5 py-3 text-xs font-black uppercase tracking-wider text-red-700 transition hover:bg-red-200"
                  >
                    <FiTrash2 size={16} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
