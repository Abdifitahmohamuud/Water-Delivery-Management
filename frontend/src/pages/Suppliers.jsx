import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiMapPin, FiStar, FiPackage, FiSearch, FiArrowRight } from "react-icons/fi";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_URL}/suppliers/public`);
      setSuppliers(res.data);
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const name = s.supplierBusinessName || s.businessName || s.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[color:var(--bg-main)] pb-20 pt-8 text-left">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header section */}
        <div className="mb-10 rounded-3xl border border-[color:var(--border-color)] bg-white p-8 shadow-sm">
          <span className="section-eyebrow mb-3">
            <FiBriefcase />
            Verified Partners
          </span>
          <h1 className="text-4xl font-black tracking-tight text-[color:var(--text-main)]">
            Agricultural Suppliers & Vendors
          </h1>
          <p className="mt-2 text-sm text-[color:var(--text-muted)] max-w-2xl">
            Explore trusted agricultural suppliers, view their products, ratings, and customer reviews.
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              className="w-full rounded-full border border-[color:var(--border-color)] bg-gray-50 px-12 py-3 text-sm outline-none focus:border-[color:var(--primary)] focus:bg-white"
              placeholder="Search by supplier or business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Suppliers List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-3xl bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <FiBriefcase className="mx-auto text-4xl text-gray-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-700">No Suppliers Found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => {
              const displayName = supplier.supplierBusinessName || supplier.businessName || supplier.name;
              const productCount = supplier.supplierProducts?.length || 0;

              return (
                <div
                  key={supplier.id}
                  className="group rounded-3xl border border-[color:var(--border-color)] bg-white p-6 shadow-sm transition hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-4">
                      {supplier.profilePhotoUrl ? (
                        <img
                          src={`${API_URL.replace("/api", "")}${supplier.profilePhotoUrl}`}
                          alt={displayName}
                          className="h-16 w-16 rounded-2xl object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-2xl font-black">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h3 className="text-xl font-bold text-[color:var(--text-main)] group-hover:text-[color:var(--primary)] transition">
                          {displayName}
                        </h3>
                        <p className="text-xs text-[color:var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <FiBriefcase className="text-emerald-700" /> Owner: {supplier.name}
                        </p>
                      </div>
                    </div>

                    {supplier.deliveryAddress && (
                      <p className="mt-4 text-xs text-gray-600 flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl">
                        <FiMapPin className="text-emerald-700 shrink-0" />
                        <span className="truncate">{supplier.deliveryAddress}</span>
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs font-semibold text-gray-600">
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <FiStar className="fill-amber-400" />
                        {supplier.avgRating > 0 ? supplier.avgRating : "New"}
                        <span className="text-gray-400 font-normal">({supplier.reviewCount} reviews)</span>
                      </span>

                      <span className="flex items-center gap-1 text-emerald-700">
                        <FiPackage />
                        {productCount} Products
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/suppliers/${supplier.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--surface-soft)] py-3 text-xs font-black uppercase tracking-wider text-[color:var(--primary)] transition group-hover:bg-[color:var(--primary)] group-hover:text-white"
                  >
                    View Profile & Products
                    <FiArrowRight />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;
