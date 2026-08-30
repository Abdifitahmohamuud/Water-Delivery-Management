import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import api from "../lib/api";

const NotificationBell = () => {
  const queryClient = useQueryClient();

  const { data: rawData } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 3000,
  });

  const notifications = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.notifications)
    ? rawData.notifications
    : [];

  const markAllRead = useMutation({
    mutationFn: () => api.put("/notifications/mark-all/read"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative group">
      <button
        type="button"
        aria-label={`${unread} unread notifications`}
        className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition hover:border-cyan-600 hover:text-cyan-600"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[20px] bg-cyan-600 text-white rounded-full px-1 py-0.5 text-center text-[10px] font-black">
            {unread}
          </span>
        )}
      </button>

      <div className="invisible absolute right-0 top-14 z-50 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Notifications
          </p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs font-bold text-cyan-600 hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.slice(0, 8).map((n) => (
            <div
              key={n.id}
              className={`py-3 text-left ${!n.isRead ? "bg-cyan-50/50 dark:bg-cyan-950/20 px-2 rounded-xl" : ""}`}
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title || "Notification"}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))}

          {notifications.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-400">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;