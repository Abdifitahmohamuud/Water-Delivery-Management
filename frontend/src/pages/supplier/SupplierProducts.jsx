import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Edit3, LoaderCircle, PackagePlus, Plus, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { resolveMediaUrl } from "../../lib/media";

const AGRICULTURAL_CATEGORIES = [
  { value: "SEEDS", label: "Certified Seeds" },
  { value: "FERTILIZERS", label: "NPK & Organic Fertilizers" },
  { value: "PESTICIDES", label: "Pesticides & Crop Protection" },
  { value: "FARM_TOOLS", label: "Farm Tools & Machinery" },
  { value: "IRRIGATION_EQUIPMENT", label: "Solar Irrigation & Drip Kits" },
  { value: "ANIMAL_FEED", label: "Livestock & Animal Feed" },
  { value: "OTHER", label: "Other Agribusiness Inputs" },
];

const UNITS = ["bag", "kg", "liter", "kit", "piece", "pack", "ton"];

const SupplierProducts = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "SEEDS",
    stockQuantity: "",
    lowStockThreshold: "10",
    unit: "bag",
    images: []
  });

  const { data, isLoading } = useQuery({
    queryKey: ["supplier-products"],
    queryFn: async () => {
      const profileRes = await api.get("/auth/profile");
      const profile = profileRes.data;
      const productsRes = await api.get(`/products?supplierId=${profile.id}`);
      return { profile, products: productsRes.data };
    },
  });

  const isApproved = data?.profile?.verificationStatus === "APPROVED";

  const createMutation = useMutation({
    mutationFn: (newProduct) => api.post("/products", newProduct, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-products"]);
      toast.success("Farm input listing created!");
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create input listing");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updatedData }) => api.put(`/products/${id}`, updatedData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-products"]);
      toast.success("Farm input listing updated!");
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update input listing");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["supplier-products"]);
      toast.success("Farm input deleted successfully!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete input");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!editingProduct && formData.images.length === 0) {
      toast.error("Please upload at least one product image.");
      return;
    }

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("description", formData.description);
    payload.append("price", formData.price);
    payload.append("stock", formData.stock);
    payload.append("stockQuantity", formData.stockQuantity || formData.stock);
    payload.append("lowStockThreshold", formData.lowStockThreshold || "10");
    payload.append("unit", formData.unit);
    payload.append("category", formData.category);
    payload.append("supplierId", data?.profile?.id);

    if (formData.images.length > 0) {
      for (let i = 0; i < formData.images.length; i++) {
        payload.append("images", formData.images[i]);
      }
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, updatedData: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        stock: product.stock,
        category: product.category || "SEEDS",
        stockQuantity: product.stockQuantity || product.stock,
        lowStockThreshold: product.lowStockThreshold || "10",
        unit: product.unit || "bag",
        images: []
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "SEEDS",
        stockQuantity: "",
        lowStockThreshold: "10",
        unit: "bag",
        images: []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-8 pb-16 text-left transition-colors duration-300">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black font-heading text-[color:var(--text-main)]">
            My Farm Input Catalog
          </h1>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">
            Manage your listed seeds, fertilizers, tools, and irrigation inventory.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[color:var(--primary)] px-6 py-3.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-md transition-all hover:bg-[color:var(--primary-hover)]"
        >
          <PackagePlus size={16} />
          Add New Farm Input
        </button>
      </div>

      {!isApproved && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <span>
            Your supplier profile is currently pending admin KYC approval. Once approved, your listed inputs will be visible to farmers nationwide.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-[color:var(--text-muted)]">
          <LoaderCircle className="animate-spin text-3xl text-[color:var(--primary)]" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--bg-card-solid)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[color:var(--border-color)] bg-[color:var(--surface-soft)] text-[10px] font-extrabold uppercase tracking-[0.15em] text-[color:var(--primary)]">
                <tr>
                  <th className="p-4">Input Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border-color)] font-bold">
                {data?.products?.map((p) => {
                  const isLow = p.stock < (p.lowStockThreshold || 10);
                  return (
                    <tr key={p.id} className="transition-colors hover:bg-[color:var(--surface-soft)]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveMediaUrl(p.images?.[0]) || "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=100&auto=format"}
                            alt={p.name}
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-[color:var(--border-color)]"
                          />
                          <div>
                            <p className="font-extrabold text-[color:var(--text-main)]">{p.name}</p>
                            <p className="line-clamp-1 text-[10px] text-[color:var(--text-muted)]">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-2.5 py-1 text-[10px] font-black uppercase text-[color:var(--primary)]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 font-black text-[color:var(--text-main)]">
                        ${p.price} <span className="text-[10px] text-[color:var(--text-muted)]">/ {p.unit}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          isLow
                            ? "border border-amber-500/20 bg-amber-500/10 text-amber-600"
                            : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                        }`}>
                          {p.stock} {p.unit}s {isLow && "(Low Stock)"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(p)}
                            className="rounded-xl p-2 text-blue-500 transition-colors hover:bg-[color:var(--surface-soft)]"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(p.id)}
                            className="rounded-xl p-2 text-red-500 transition-colors hover:bg-[color:var(--surface-soft)]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[color:var(--border-color)] bg-[color:var(--bg-card-solid)] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[color:var(--border-color)] pb-4">
              <h3 className="text-lg font-black text-[color:var(--text-main)]">
                {editingProduct ? "Edit Input Listing" : "Add Agricultural Input"}
              </h3>
              <button onClick={closeModal} className="rounded-xl p-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-main)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Input Name</label>
                <input
                  type="text"
                  placeholder="e.g. High-Yield Sorghum Seed 50kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-3 text-xs font-bold text-[color:var(--text-main)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-3 text-xs font-bold text-[color:var(--text-main)] focus:outline-none"
                  >
                    {AGRICULTURAL_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Unit of Measure</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-3 text-xs font-bold text-[color:var(--text-main)] focus:outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="35.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-3 text-xs font-bold text-[color:var(--text-main)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Stock Quantity</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-3 text-xs font-bold text-[color:var(--text-main)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Low Stock Alert</label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                    className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] px-4 py-3 text-xs font-bold text-[color:var(--text-main)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Description & Usage Guidelines</label>
                <textarea
                  rows="3"
                  placeholder="Germination percentage, dosage rate per hectare..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] p-3 text-xs text-[color:var(--text-main)] placeholder:text-[color:var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Product Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, images: e.target.files })}
                  required={!editingProduct}
                  className="w-full rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] p-3 text-xs text-[color:var(--text-main)] file:mr-4 file:rounded-xl file:border-0 file:bg-[color:var(--primary)] file:px-4 file:py-2 file:text-[10px] file:font-black file:uppercase file:tracking-[0.16em] file:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full rounded-2xl bg-[color:var(--primary)] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-all hover:bg-[color:var(--primary-hover)] disabled:opacity-70"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingProduct
                  ? "Update Listing"
                  : "Save Farm Input"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProducts;
