import { useParams, Link, useNavigate } from "react";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiTruck, FiShield, FiPlusCircle } from "react-icons/fi";
import api from "../lib/api";
import toast from "react-hot-toast";

const DEFAULT_WATER_IMAGES = {
  jerrycan: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80",
  container: "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=600&q=80",
  bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
  tanker: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
};

function getProductImage(prod) {
  if (prod?.imageUrl) return prod.imageUrl;
  const name = prod?.name?.toLowerCase() || "";
  if (name.includes("bottle")) return DEFAULT_WATER_IMAGES.bottle;
  if (name.includes("container")) return DEFAULT_WATER_IMAGES.container;
  if (name.includes("tanker") || name.includes("bulk")) return DEFAULT_WATER_IMAGES.tanker;
  return DEFAULT_WATER_IMAGES.jerrycan;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (error) {
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen pt-32 text-center text-slate-500">Loading water product details...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 text-center space-y-4">
        <h2 className="text-2xl font-bold">Water Product Not Found</h2>
        <Link to="/shop" className="text-cyan-600 font-bold hover:underline">
          Back to Products Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pt-28 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider hover:underline"
        >
          <FiArrowLeft /> Back to Water Products Catalog
        </Link>

        <div className="bg-slate-800/80 rounded-3xl p-8 border border-slate-700/60 shadow-2xl space-y-6">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-700/60">
            <img
              src={getProductImage(product)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            <span className="absolute top-4 left-4 bg-cyan-600 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
              {product.unit}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
            <div>
              <h1 className="text-3xl font-black text-white">{product.name}</h1>
              <span className="text-xs font-bold text-slate-400">Unit Type: {product.unit}</span>
            </div>
            <div className="text-4xl font-black text-cyan-400">${product.currentPrice.toFixed(2)}</div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {product.description || "Purified, multi-stage filtered fresh drinking water compliant with standard WHO safety requirements."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-300 pt-2">
            <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50">
              <FiTruck className="text-cyan-400 text-xl" /> Fast Doorstep Delivery
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-700/50">
              <FiShield className="text-cyan-400 text-xl" /> Certified Pure Quality
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => navigate(`/checkout?productId=${product.id}`)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest transition shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2"
            >
              <FiPlusCircle /> Order This Product Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
