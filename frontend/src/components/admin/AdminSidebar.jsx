import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ShoppingCart,
  Droplets,
  Truck,
  Users,
  Wallet,
  BarChart3,
  LifeBuoy,
  ClipboardList,
  Settings,
  ArrowLeftToLine,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", end: true, icon: LayoutGrid, label: "Dashboard" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/admin/products", icon: Droplets, label: "Water Products" },
  { to: "/admin/drivers", icon: Truck, label: "Drivers" },
  { to: "/admin/customers", icon: Users, label: "Customers" },
  { to: "/admin/finance", icon: Wallet, label: "Finance & Credit Ledger" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports & Analytics" },
  { to: "/admin/support", icon: LifeBuoy, label: "Support Tickets" },
  { to: "/admin/audit-logs", icon: ClipboardList, label: "Audit Logs" },
  { to: "/admin/settings", icon: Settings, label: "System Settings" },
];

const AdminSidebar = () => {
  return (
    <aside className="sidebar-shell flex w-full shrink-0 flex-col border-b border-[color:var(--border-color)] md:w-72 md:border-b-0 md:border-r bg-white dark:bg-slate-900">
      <div className="flex h-20 items-center gap-3 border-b border-[color:var(--border-color)] px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-xl">
          💧
        </div>
        <div className="text-left">
          <p className="text-base font-black tracking-wider text-slate-900 dark:text-white">HYDROFLOW</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600">Water Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 text-left">
        {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition ${
                isActive
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[color:var(--border-color)] p-4">
        <NavLink
          to="/"
          className="flex items-center gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 transition hover:text-cyan-600"
        >
          <ArrowLeftToLine className="h-4 w-4" />
          <span>Exit to Customer Site</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;
