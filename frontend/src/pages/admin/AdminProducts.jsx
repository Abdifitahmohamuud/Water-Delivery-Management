import { useState, useEffect } from "react";
import api from "../../lib/api";
import toast from "react-hot-toast";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "Jerrycan",
    currentPrice: "",
    imageUrl: "",
    isActive: true,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products", { params: { activeOnly: "false" } });
      setProducts(res.data || []);
    } catch (error) {
      toast.error("Failed to load water products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ name: "", description: "", unit: "Jerrycan", currentPrice: "", imageUrl: "", isActive: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      description: prod.description || "",
      unit: prod.unit || "Jerrycan",
      currentPrice: prod.currentPrice,
      imageUrl: prod.imageUrl || "",
      isActive: prod.isActive,
    });
    setModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    setUploadingImage(true);
    try {
      const res = await api.post("/products/upload-image", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.imageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
        toast.success("Image uploaded to Cloudflare R2 successfully!");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success("Product updated successfully!");
      } else {
        await api.post("/products", formData);
        toast.success("New product created successfully!");
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (prod) => {
    try {
      await api.put(`/products/${prod.id}`, { isActive: !prod.isActive });
      toast.success(`Product ${!prod.isActive ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error) {
      toast.error("Failed to toggle status");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Water Products Catalog 💧</h1>
          <p className="text-xs text-slate-500 mt-1">Manage products, Cloudflare R2 image uploads, units, and prices</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-cyan-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-cyan-700 transition"
        >
          + Add New Product
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading products...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className={`p-6 rounded-2xl border bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between ${
                prod.isActive ? "border-slate-200 dark:border-slate-800" : "border-rose-200 bg-rose-50/20"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} className="h-14 w-14 rounded-2xl object-cover border" />
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 font-bold text-2xl flex items-center justify-center">
                        💧
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{prod.name}</h3>
                      <span className="text-[11px] text-slate-400 font-bold">Unit: {prod.unit}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      prod.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {prod.isActive ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{prod.description || "Purified drinking water container"}</p>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">Current Price:</span>
                    <span className="font-black text-cyan-600 text-lg">${prod.currentPrice}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-2 rounded-xl text-xs hover:bg-slate-200"
                >
                  Edit / Upload Image
                </button>
                <button
                  onClick={() => handleToggleActive(prod)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold text-white ${
                    prod.isActive ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  {prod.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingProduct ? `Edit ${editingProduct.name}` : "Create New Water Product"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  placeholder="E.g., 20 Liter Jerrycan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              {/* Image Upload Input */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Upload Product Image (Cloudflare R2)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 p-2 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
                {uploadingImage && <p className="text-xs text-cyan-600 font-bold mt-1">Uploading image to Cloudflare R2...</p>}

                {formData.imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <img src={formData.imageUrl} alt="preview" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="text-[11px] text-emerald-600 font-bold truncate">R2 Image Ready</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Unit Type *</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                    placeholder="Jerrycan / Container"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded text-cyan-600"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Active (available for ordering)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700"
                >
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}