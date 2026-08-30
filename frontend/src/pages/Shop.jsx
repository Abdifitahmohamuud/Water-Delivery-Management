import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

// Premium Water Renders as high quality fallback graphics
const DEFAULT_WATER_IMAGES = {
  jerrycan: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80",
  container: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=600&q=80",
  bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
  tanker: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
};

function getProductImage(prod) {
  if (prod.imageUrl) return prod.imageUrl;
  const name = prod.name?.toLowerCase() || "";
  if (name.includes("bottle")) return DEFAULT_WATER_IMAGES.bottle;
  if (name.includes("container")) return DEFAULT_WATER_IMAGES.container;
  if (name.includes("tanker") || name.includes("bulk")) return DEFAULT_WATER_IMAGES.tanker;
  return DEFAULT_WATER_IMAGES.jerrycan;
}

export default function Shop() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", { params: { search } });
      setProducts(res.data || []);
    } catch (error) {
      toast.error("Failed to load water products catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const filteredProducts = products.filter((p) => {
    if (activeFilter === "ALL") return true;
    return p.unit?.toLowerCase().includes(activeFilter.toLowerCase()) || p.name?.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="min-h-screen pt-24 pb-20 bg-slate-900 text-white font-sans selection:bg-cyan-500 selection:text-white">
      {/* Hero Catalog Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-900/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-cyan-500/10">
            💧 HydroFlow Certified Pure Water
          </span>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Purified Water <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Products & Sizes</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Order fresh 20L Jerrycans, 10L office containers, packaged water bottles, or bulk tanker dispatches delivered right to your doorstep.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <input
              type="text"
              placeholder="Search water products by name or container type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition font-semibold"
            />
            <span className="absolute left-4 top-8 text-slate-400 text-lg">🔍</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 pt-10">
        {/* Category Filters */}
        <div className="flex justify-center flex-wrap gap-2 sm:gap-3">
          {["ALL", "Jerrycan", "Container", "Bottle", "Tanker"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                activeFilter === filter
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105"
                  : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {filter === "ALL" ? "All Products" : filter}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-slate-800/50 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-slate-800/30 rounded-3xl border border-slate-800">
            <span className="text-4xl">💧</span>
            <h3 className="text-xl font-bold text-white">No Water Products Found</h3>
            <p className="text-xs text-slate-400">Try searching for a different size or container type.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="group bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/60 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Image Container with Hover Zoom */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                    <img
                      src={getProductImage(prod)}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                    <div className="absolute top-4 left-4">
                      <span className="bg-cyan-500/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        {prod.unit || "Jerrycan"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-4">
                      <span className="text-2xl font-black text-white drop-shadow-md">
                        ${prod.currentPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {prod.description || "Purified, multi-stage filtered fresh drinking water compliant with WHO standards."}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-400 border-t border-slate-700/50">
                      <span>Delivery Available: <strong className="text-emerald-400">Yes (Express)</strong></span>
                      <span>Quality: <strong className="text-cyan-400">99.9% Pure</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => navigate(`/checkout?productId=${prod.id}`)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
                  >
                    <span>Order This Product</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}