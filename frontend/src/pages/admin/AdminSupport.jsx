import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  // Resolution Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState("RESOLVED");
  const [resolutionText, setResolutionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/support/admin/tickets", {
        params: { status: statusFilter || undefined },
      });
      setTickets(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSubmitting(true);
    try {
      await api.put(`/support/admin/tickets/${selectedTicket.id}`, {
        status: newStatus,
        resolution: resolutionText,
      });
      toast.success("Support ticket updated successfully!");
      setSelectedTicket(null);
      setResolutionText("");
      fetchTickets();
    } catch (error) {
      toast.error("Failed to update ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Customer Support Tickets 🎧</h1>
          <p className="text-xs text-slate-500 mt-1">Review customer issues, inquiries, and delivery feedback</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No support tickets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Ticket #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Subject & Message</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-cyan-600">{ticket.ticketNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{ticket.customer?.user?.fullName}</div>
                      <div className="text-xs text-slate-400">📞 {ticket.customer?.user?.phone}</div>
                    </td>
                    <td className="p-4 max-w-md">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{ticket.subject}</div>
                      <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{ticket.message}</div>
                      {ticket.resolution && (
                        <div className="text-xs bg-emerald-50 text-emerald-800 p-1.5 rounded mt-1">
                          <strong>Resolution:</strong> {ticket.resolution}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getTicketBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setNewStatus(ticket.status);
                          setResolutionText(ticket.resolution || "");
                        }}
                        className="bg-cyan-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-cyan-700"
                      >
                        Respond / Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ticket {selectedTicket.ticketNumber}
            </h3>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-1">
              <div><strong>Subject:</strong> {selectedTicket.subject}</div>
              <div><strong>Customer:</strong> {selectedTicket.customer?.user?.fullName} ({selectedTicket.customer?.user?.phone})</div>
              <div><strong>Message:</strong> {selectedTicket.message}</div>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Resolution / Response Note</label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Type response to customer..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
