import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiBriefcase, FiMapPin, FiStar, FiPackage, FiCheckCircle, FiMessageSquare, FiSend, FiClock } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import api from "../lib/api";
import { resolveMediaUrl } from "../lib/media";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SupplierDetail = () => {
  const { id } = useParams();
  const { user } = useAuthStore();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmittedNotice, setReviewSubmittedNotice] = useState(false);

  useEffect(() => {
    fetchSupplierDetails();
  }, [id]);

  const fetchSupplierDetails = async () => {
    try {
      const res = await axios.get(`${API_URL}/suppliers/public/${id}`);
      setSupplier(res.data);
    } catch (error) {
      console.error("Failed to fetch supplier details", error);
      toast.error("Supplier not found");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to leave a review.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please enter a review comment.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post("/reviews", {
        supplierId: id,
        targetType: "SUPPLIER",
        rating,
        comment: comment.trim(),
      });

      setComment("");
      setRating(5);
      setReviewSubmittedNotice(true);
      toast.success("Review submitted! Pending admin approval.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-bold text-gray-500">Loading Supplier Profile...</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Supplier Not Found</h2>
        <Link to="/suppliers" className="mt-4 inline-block font-bold text-emerald-700 underline">
          Back to Suppliers
        </Link>
      </div>
    );
  }

  const displayName = supplier.supplierBusinessName || supplier.businessName || supplier.name;

  return (
    <div className="min-h-screen bg-[color:var(--bg-main)] pb-20 pt-8 text-left">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-6 text-xs text-gray-500 flex items-center gap-2">
          <Link to="/" className="hover:underline">Home</Link>
          <span>/</span>
          <Link to="/suppliers" className="hover:underline">Suppliers</Link>
          <span>/</span>
          <span className="font-bold text-gray-800">{displayName}</span>
        </div>

        {/* Supplier Banner / Profile Card */}
        <div className="rounded-3xl border border-[color:var(--border-color)] bg-white p-8 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {supplier.profilePhotoUrl ? (
                <img
                  src={`${API_URL.replace("/api", "")}${supplier.profilePhotoUrl}`}
                  alt={displayName}
                  className="h-24 w-24 rounded-3xl object-cover border-2 border-emerald-600 shadow-md"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-700 text-white text-4xl font-black shadow-md">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 mb-2">
                  <FiCheckCircle /> Verified Supplier
                </span>
                <h1 className="text-3xl font-black text-[color:var(--text-main)]">{displayName}</h1>
                <p className="text-sm text-[color:var(--text-muted)] mt-1 flex items-center gap-2">
                  <FiBriefcase className="text-emerald-700" /> Owner: {supplier.name}
                  {supplier.deliveryAddress && (
                    <>
                      <span>•</span>
                      <FiMapPin className="text-emerald-700" /> {supplier.deliveryAddress}
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              <div className="text-center">
                <p className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                  <FiStar className="fill-amber-400" />
                  {supplier.avgRating > 0 ? supplier.avgRating : "N/A"}
                </p>
                <p className="text-xs text-gray-500 mt-1">{supplier.reviewCount} Ratings</p>
              </div>

              <div className="text-center border-l pl-6">
                <p className="text-2xl font-black text-emerald-700">{supplier.supplierProducts?.length || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Products Listed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Supplier Products Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-[color:var(--text-main)] flex items-center gap-2">
              <FiPackage className="text-emerald-700" /> Products by {displayName}
            </h2>
          </div>

          {supplier.supplierProducts?.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              This supplier has not listed any products yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {supplier.supplierProducts?.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group rounded-2xl border border-[color:var(--border-color)] bg-white p-4 transition hover:shadow-lg"
                >
                  <div className="h-44 w-full overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={resolveMediaUrl(product.images?.[0]) || "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <h4 className="mt-3 font-bold text-[color:var(--text-main)] group-hover:text-[color:var(--primary)]">
                    {product.name}
                  </h4>
                  <p className="mt-1 text-sm font-black text-emerald-700">${product.price}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Approved Reviews List */}
          <div className="lg:col-span-2 rounded-3xl border border-[color:var(--border-color)] bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-[color:var(--text-main)] mb-6 flex items-center gap-2">
              <FiMessageSquare className="text-emerald-700" /> Customer Reviews & Ratings
            </h3>

            {supplier.supplierReviews?.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-6 text-center">
                No approved reviews for this supplier yet. Be the first to leave a review!
              </p>
            ) : (
              <div className="space-y-4">
                {supplier.supplierReviews?.map((rev) => (
                  <div key={rev.id} className="rounded-2xl bg-gray-50 p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white font-bold text-xs">
                          {rev.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="font-bold text-sm text-gray-800">{rev.user?.name || "Customer"}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`h-4 w-4 ${i < rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 pl-10">{rev.comment}</p>
                    <p className="text-[10px] text-gray-400 pl-10 mt-2">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Write a Supplier Review Form */}
          <div className="rounded-3xl border border-[color:var(--border-color)] bg-white p-6 shadow-sm h-fit">
            <h3 className="text-lg font-black text-[color:var(--text-main)] mb-4">Rate & Review Supplier</h3>

            {reviewSubmittedNotice && (
              <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-start gap-2">
                <FiClock className="text-amber-600 text-base shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Review Under Review</p>
                  <p className="mt-0.5">Your review was submitted and will be publicly visible once approved by an Admin.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition hover:scale-110"
                    >
                      <FiStar
                        className={`h-7 w-7 ${
                          star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-sm text-gray-700">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                  placeholder="Share your experience with this supplier..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--primary)] py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[color:var(--primary-hover)] disabled:opacity-60"
              >
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetail;
