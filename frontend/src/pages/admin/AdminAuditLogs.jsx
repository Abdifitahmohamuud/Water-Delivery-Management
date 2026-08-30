import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get("/audit");
      setLogs(res.data?.logs || []);
    } catch (error) {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading system audit logs...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">System Audit Logs 🛡️</h1>
        <p className="text-xs text-slate-500 mt-1">Immutable audit trail of administrative, driver, and order events</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Details / Metadata</th>
                  <th className="p-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {log.actorUser?.fullName || log.actor || "System"}
                      {log.actorUser?.role && (
                        <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-500">
                          {log.actorUser.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-400 font-bold px-2.5 py-1 rounded-md text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{log.targetType}</td>
                    <td className="p-4 max-w-xs text-xs font-mono text-slate-500 truncate">
                      {log.newValue ? JSON.stringify(log.newValue) : log.targetId}
                    </td>
                    <td className="p-4 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
