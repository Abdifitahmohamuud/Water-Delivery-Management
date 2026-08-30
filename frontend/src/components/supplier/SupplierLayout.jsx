import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import SupplierSidebar from "./SupplierSidebar";
import useAuthStore from "../../store/useAuthStore";
import {
  ArrowLeft,
  BriefcaseBusiness,
  LogOut,
  MoonStar,
  SunMedium,
  UserRound,
} from "lucide-react";
import brandLogo from "../../assets/logo.png";
import NotificationBell from "../NotificationBell";

const SupplierLayout = () => {
  const { user, logout } = useAuthStore();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme !== "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const photoUrl = user?.profilePhotoUrl
    ? (user.profilePhotoUrl.startsWith("http") ? user.profilePhotoUrl : `http://localhost:5000${user.profilePhotoUrl}`)
    : null;

  return (
    <div className="dashboard-shell min-h-screen text-[color:var(--text-main)] flex flex-col md:flex-row">
      <SupplierSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="dashboard-topbar px-5 md:px-8">
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="brand" className="h-10 w-10 rounded-2xl object-cover border border-[color:var(--border-color)]" />
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--primary)]">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--accent)] animate-pulse" />
                  Supplier workspace
                </div>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">Catalog, orders, and business reporting</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <NotificationBell />
              <button
                type="button"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                aria-label="Toggle color theme"
                className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] text-[color:var(--text-main)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)]"
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <SunMedium className="h-4 w-4 text-[color:var(--accent)]" />
                ) : (
                  <MoonStar className="h-4 w-4 text-[color:var(--primary)]" />
                )}
              </button>

              <Link
                to="/"
                className="hidden items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--text-main)] transition hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] sm:inline-flex"
              >
                <ArrowLeft className="h-4 w-4" />
                Market home
              </Link>

              <div className="hidden items-center gap-3 rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-2 md:flex">
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[color:var(--bg-card-solid)] text-[color:var(--primary)]">
                  {photoUrl ? <img src={photoUrl} alt={user?.name} className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-[color:var(--text-main)]">{user?.name || "Supplier Partner"}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--primary)]">
                    <BriefcaseBusiness className="h-3 w-3" /> Verified supplier
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[color:var(--primary-hover)]"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard-content flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SupplierLayout;
