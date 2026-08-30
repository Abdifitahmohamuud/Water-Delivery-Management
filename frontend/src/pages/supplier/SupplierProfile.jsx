import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { FiUser, FiCamera, FiCheckCircle, FiShield, FiBriefcase, FiFileText } from "react-icons/fi";

const SupplierProfile = () => {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    deliveryAddress: "",
    profilePhotoUrl: "",
    businessName: "",
    supplierBusinessName: "",
    licenseDocumentUrl: "",
    supplierLicenseNumber: "",
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [verificationDocumentFile, setVerificationDocumentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => {
      const { data } = await api.get("/auth/profile");
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phoneNumber: profile.phoneNumber || "",
        deliveryAddress: profile.deliveryAddress || "",
        profilePhotoUrl: profile.profilePhotoUrl || "",
        businessName: profile.businessName || "",
        supplierBusinessName: profile.supplierBusinessName || "",
        licenseDocumentUrl: profile.licenseDocumentUrl || "",
        supplierLicenseNumber: profile.supplierLicenseNumber || "",
      });

      if (profile.profilePhotoUrl) {
        const fullUrl = profile.profilePhotoUrl.startsWith("http")
          ? profile.profilePhotoUrl
          : `http://localhost:5000${profile.profilePhotoUrl}`;
        setPreviewUrl(fullUrl);
      }
    }
  }, [profile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVerificationDocumentFile(file);
      setForm((current) => ({ ...current, licenseDocumentUrl: file.name }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("phoneNumber", form.phoneNumber);
      formData.append("deliveryAddress", form.deliveryAddress);
      formData.append("businessName", form.businessName);
      formData.append("supplierBusinessName", form.supplierBusinessName);
      formData.append("supplierLicenseNumber", form.supplierLicenseNumber);

      if (profilePhotoFile) {
        formData.append("profilePhoto", profilePhotoFile);
      }

      if (verificationDocumentFile) {
        formData.append("verificationDocument", verificationDocumentFile);
      } else if (form.licenseDocumentUrl) {
        formData.append("licenseDocumentUrl", form.licenseDocumentUrl);
      }

      await api.put("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Supplier profile updated successfully!");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-600/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest font-bold">Loading Profile Information...</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left pb-16 transition-colors duration-300">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-black font-heading text-slate-900 dark:text-white">
            Agrovet Supplier Profile & KYC
          </h1>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            profile?.verificationStatus === "APPROVED"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          }`}>
            {profile?.verificationStatus || "PENDING VERIFICATION"}
          </span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Manage your agribusiness credentials, contact info, and registration license.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-8 shadow-xl"
      >
        {/* Profile Avatar Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-emerald-600/20 overflow-hidden flex items-center justify-center text-slate-400 text-3xl font-bold">
              {previewUrl ? (
                <img src={previewUrl} alt="Supplier Profile" className="w-full h-full object-cover" />
              ) : (
                <FiUser />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer shadow-md transition-all">
              <FiCamera className="text-sm" />
              <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
            </label>
          </div>

          <div>
            <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
              {profile?.supplierBusinessName || profile?.name || "Agrovet Partner"}
            </h4>
            <p className="text-xs text-slate-400 mt-1">Verified Seller Badge Status: {profile?.verificationStatus || "PENDING"}</p>
          </div>
        </div>

        {/* Business Credentials */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-amber-400 flex items-center gap-2">
            <FiBriefcase /> Agribusiness License & KYC
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Business Name
              </label>
              <input
                type="text"
                value={form.supplierBusinessName}
                onChange={(e) => setForm({ ...form, supplierBusinessName: e.target.value })}
                placeholder="e.g. Somali Seed & Input Supplies Ltd"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                License / Registration Number
              </label>
              <input
                type="text"
                value={form.supplierLicenseNumber}
                onChange={(e) => setForm({ ...form, supplierLicenseNumber: e.target.value })}
                placeholder="REG-2026-99"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FiFileText /> Verification Document Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleDocumentChange}
              className="w-full rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white file:font-black hover:file:bg-emerald-700"
            />
            <p className="text-[11px] text-slate-400">
              Upload a new business license or registration card image here when you update KYC.
            </p>
            {form.licenseDocumentUrl && !verificationDocumentFile ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Current document: {form.licenseDocumentUrl.split("/").pop()}
              </p>
            ) : null}
          </div>
        </div>

        {/* Contact Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Contact & Operations Info
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Contact Person Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Phone Number (EVC Plus / Zaad)
              </label>
              <input
                type="text"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="615000000"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Warehouse / Supply Store Address
            </label>
            <input
              type="text"
              value={form.deliveryAddress}
              onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
              placeholder="Bakara Agrovet District, Mogadishu"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all"
        >
          Save Profile & Submit KYC Info
        </button>
      </form>
    </div>
  );
};

export default SupplierProfile;
