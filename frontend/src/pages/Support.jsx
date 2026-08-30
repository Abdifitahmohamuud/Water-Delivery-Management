import { useState, useEffect } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/support/my-tickets");
      setTickets(res.data || []);
    } catch (error) {
      toast.error("Failed to load your support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      return toast.error("Please provide both subject and message");
    }

    setSubmitting(true);
    try {
      await api.post("/support/tickets", {
        subject,
        message,
        orderId: orderId || undefined,
      });
      toast.success("Support ticket created! Our team will respond shortly.");
      setSubject("");
      setMessage("");
      setOrderId("");
      fetchTickets();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-16 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Customer Support & Inquiries 🎧</h1>
          <p className="text-xs text-slate-500 mt-1">Have a question or delivery issue? Submit a ticket to our team</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Ticket Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit New Ticket</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="E.g., Delivery delay, wrong quantity..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Associated Order ID (Optional)</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="ORD-2026-XXXXXX"
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Detailed Message *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-md shadow-cyan-600/20"
              >
                {submitting ? "Submitting..." : "Submit Support Ticket"}
              </button>
            </form>
          </div>

          {/* Ticket History */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Tickets ({tickets.length})</h3>

            {loading ? (
              <div className="text-center py-6 text-slate-500 text-xs">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">You have no support tickets yet.</div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-cyan-600">{t.ticketNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getTicketBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{t.subject}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{t.message}</p>

                    {t.resolution && (
                      <div className="bg-emerald-50 text-emerald-800 text-xs p-2 rounded-xl mt-2 font-medium">
                        <strong>Response:</strong> {t.resolution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTicketBadge(status) {
  switch (status) {
    case "OPEN": return "bg-rose-100 text-rose-800";
    case "IN_PROGRESS": return "bg-amber-100 text-amber-800";
    case "RESOLVED": return "bg-emerald-100 text-emerald-800";
    case "CLOSED": return "bg-slate-100 text-slate-700";
    default: return "bg-slate-100 text-slate-700";
  }
}
