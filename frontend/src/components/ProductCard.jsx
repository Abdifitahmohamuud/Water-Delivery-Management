import { Link } from "react-router-dom";
import { FiShoppingBag, FiArrowRight, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import useCartStore from "../store/useCartStore";
import toast from "react-hot-toast";
import { useSettings } from "../hooks";
import { resolveMediaUrl } from "../lib/media";

const ProductCard = ({ product }) => {
  const { addItem } = useCartStore();
  const { formatPrice } = useSettings();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to farm cart!`);
  };

  const isLowStock = product.stock < (product.lowStockThreshold || 10) && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  return (
    <div className="group relative bg-white dark:bg-slate-900/90 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-600/10 dark:hover:shadow-amber-500/10 flex flex-col justify-between">
      <Link to={`/product/${product.id}`} className="flex-1 flex flex-col">
        {/* Product Image Container */}
        <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={
              resolveMediaUrl(product.images?.[0]) ||
              "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&auto=format"
            }
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {/* Category Badge */}
          <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-200 dark:border-slate-700 shadow-md">
            {product.category || "AGRICULTURAL INPUT"}
          </span>

          {/* Stock Alert Badge */}
          {isLowStock && (
            <span className="absolute top-4 right-4 px-2.5 py-1 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
              <FiAlertTriangle /> Low Stock ({product.stock})
            </span>
          )}
          {isOutOfStock && (
            <span className="absolute top-4 right-4 px-2.5 py-1 bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
              Out of Stock
            </span>
          )}

          {/* Quick Add Floating Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="absolute bottom-4 right-4 w-11 h-11 bg-emerald-600 hover:bg-emerald-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 disabled:bg-slate-400 disabled:cursor-not-allowed"
            title="Add to Cart"
          >
            <FiShoppingBag className="text-lg" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col justify-between space-y-4 text-left">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
              <span>{product.supplier?.supplierBusinessName || product.supplier?.name || "Verified Agrovet"}</span>
              {product.supplier?.verificationStatus === "APPROVED" && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <FiCheckCircle /> Verified
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mt-1">
              {product.description || "High performance agricultural input for Somali growing seasons."}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-amber-400">
                {formatPrice(product.price)}
              </span>
              {product.unit && (
                <span className="text-[11px] text-slate-400 font-bold ml-1">/ {product.unit}</span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-amber-400 transition-colors">
              View Input <FiArrowRight />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
