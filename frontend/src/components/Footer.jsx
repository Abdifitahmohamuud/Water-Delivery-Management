import { Link } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin, FiShield, FiTruck } from "react-icons/fi";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-slate-800">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-xl">
                💧
              </div>
              <span className="text-xl font-black tracking-wider text-white">
                HYDROFLOW WATER
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              HydroFlow Water Delivery Management System provides fast, reliable purified drinking water ordering, driver dispatch, and automated delivery tracking for households and businesses.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-cyan-400">
              <span className="inline-flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full">
                <FiShield /> Certified Pure Water
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full">
                <FiTruck /> Express Fleet Dispatch
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Navigation</h4>
            <ul className="space-y-2 text-xs font-semibold">
              <li><Link to="/" className="hover:text-cyan-400">Home Dashboard</Link></li>
              <li><Link to="/shop" className="hover:text-cyan-400">Water Products</Link></li>
              <li><Link to="/checkout" className="hover:text-cyan-400">Order Water</Link></li>
              <li><Link to="/my-orders" className="hover:text-cyan-400">Track My Orders</Link></li>
              <li><Link to="/support" className="hover:text-cyan-400">Customer Support</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Contact HydroFlow</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><FiPhone className="text-cyan-400" /> <span>+252 61 5000000</span></div>
              <div className="flex items-center gap-2"><FiMail className="text-cyan-400" /> <span>info@hydroflowwater.com</span></div>
              <div className="flex items-center gap-2"><FiMapPin className="text-cyan-400" /> <span>Mogadishu, Somalia</span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 text-xs text-slate-500 font-semibold gap-4">
          <p>&copy; {new Date().getFullYear()} HYDROFLOW Water Delivery Management System. All rights reserved.</p>
          <p>Production-Ready Water Logistics & Dispatch Platform</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
