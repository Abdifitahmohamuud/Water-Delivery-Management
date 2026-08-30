import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "../lib/api";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";
import { FiStar, FiClock, FiSend } from "react-icons/fi";

const Reviews = ({ productId }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await api.get(`/reviews/${productId}`);
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (newReview) => api.post("/reviews", newReview),
    onSuccess: () => {
      queryClient.invalidateQueries(["reviews", productId]);
      setComment("");
      setSubmittedNotice(true);
      toast.success("Review submitted! Pending admin approval.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to post review.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    mutation.mutate({ productId, targetType: "PRODUCT", rating, comment: comment.trim() });
  };

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm text-left">
      <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        Customer Reviews & Ratings
      </h3>

      {user ? (
        <div className="mb-10 rounded-2xl bg-gray-50 p-6 border border-gray-200">
          <h4 className="font-bold text-sm text-gray-800 mb-3">Write a Product Review</h4>

          {submittedNotice && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 flex items-start gap-2">
              <FiClock className="text-amber-600 text-base shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Review Under Moderation</p>
                <p className="mt-0.5">Your review has been submitted and will be publicly displayed once approved by an admin.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRating(num)}
                    className="p-1 transition hover:scale-110"
                  >
                    <FiStar
                      className={`h-7 w-7 ${
                        num <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 font-bold text-sm text-gray-700">{rating} / 5</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Comment
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-emerald-600"
                placeholder="Write your detailed product feedback..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {mutation.isPending ? "Submitting..." : "Submit Review"}
              <FiSend />
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 font-bold">
          Please sign in to write a review.
        </div>
      )}

      {/* Public Approved Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading reviews...</p>
        ) : reviews?.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No approved reviews yet. Be the first to review this product!</p>
        ) : (
          reviews?.map((review) => (
            <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-gray-800">{review.user?.name || "Customer"}</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-700">{review.comment}</p>
              <p className="text-[10px] text-gray-400 mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
