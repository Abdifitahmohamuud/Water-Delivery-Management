import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiDroplet,
  FiUser,
  FiLogOut,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiShield,
  FiTruck,
  FiHelpCircle,
  FiPlusCircle,
} from "react-icons/fi";
import useAuthStore from "../store/useAuthStore";
import NotificationBell from "./NotificationBell";

const NAV_LINKS = [
  { name: "Home", path: "/" },
  { name: "Water Products", path: "/shop" },
  { name: "Order Water", path: "/checkout" },
  { name: "My Orders", path: "/my-orders" },
  { name: "Support", path: "/support" },
];

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.classList.toggle("light", theme !== "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const getRoleDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin";
    if (user.role === "DRIVER") return "/driver";
    return "/my-orders";
  };

  const navBase = "text-xs font-bold uppercase tracking-wider transition-colors";
  const navActive = "text-cyan-600 dark:text-cyan-400";
  const navIdle = "text-slate-600 dark:text-slate-300 hover:text-cyan-600";

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] font-sans">
      {/* Top Banner */}
      <div className="bg-cyan-700 text-white text-xs font-bold tracking-wide py-1.5 px-4 text-center">
        <span>💧 Pure Drinking Water Delivery | Fast & Reliable Supply</span>
      </div>

      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md py-3"
            : "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600 text-white font-bold text-2xl shadow-md shadow-cyan-600/30">
              💧
            </div>
            <div className="text-left">
              <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white">
                HYDROFLOW
              </span>
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-cyan-600">
                Water Delivery Management
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => `${navBase} ${isActive ? navActive : navIdle}`}
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/checkout"
              className="hidden sm:inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md shadow-cyan-600/20 transition"
            >
              <FiPlusCircle /> Order Water Now
            </Link>

            {user && <NotificationBell />}

            <button
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to={getRoleDashboardPath()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  {user.role === "ADMIN" ? (
                    <>
                      <FiShield className="text-cyan-600" /> Admin Portal
                    </>
                  ) : user.role === "DRIVER" ? (
                    <>
                      <FiTruck className="text-cyan-600" /> Driver Portal
                    </>
                  ) : (
                    <>
                      <FiUser className="text-cyan-600" /> Dashboard
                    </>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"
                  title="Logout"
                >
                  <FiLogOut />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="flex h-full w-4/5 max-w-xs flex-col justify-between bg-white dark:bg-slate-900 p-6 text-left shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💧</div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">HYDROFLOW</p>
                    <p className="text-xs text-cyan-600 font-bold">Water Delivery</p>
                  </div>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="text-xl">
                  <FiX />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                        isActive
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              {user ? (
                <>
                  <Link
                    to={getRoleDashboardPath()}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Go to Portal ({user.role})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
