import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProductId = searchParams.get("productId") || "";

  const { user } = useAuthStore();

  const [products, setProducts] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Order Form State
  const [selectedProductId, setSelectedProductId] = useState(initialProductId);
  const [requestedQuantity, setRequestedQuantity] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentOption, setPaymentOption] = useState("PAY_NOW"); // PAY_NOW or PAY_LATER_MONTHLY

  const fetchData = async () => {
    try {
      const prodRes = await api.get("/products");
      const availableProds = prodRes.data || [];
      setProducts(availableProds);

      if (!selectedProductId && availableProds.length > 0) {
        setSelectedProductId(availableProds[0].id);
      }

      if (user && user.role === "CUSTOMER") {
        const addrRes = await api.get("/customers/addresses");
        const addrs = addrRes.data || [];
        setSavedAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else {
          setUseCustomAddress(true);
        }
      }
    } catch (error) {
      toast.error("Failed to load checkout details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const unitPrice = selectedProduct?.currentPrice || 0;
  const subtotal = unitPrice * requestedQuantity;
  const deliveryFee = 1.5; // default delivery fee
  const totalPrice = subtotal + deliveryFee;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return toast.error("Please select a water product");
    if (requestedQuantity < 1) return toast.error("Quantity must be at least 1");

    let finalAddress = "";
    if (useCustomAddress || !selectedAddressId) {
      if (!customAddress.trim()) return toast.error("Please enter a delivery address");
      finalAddress = customAddress.trim();
    } else {
      const chosen = savedAddresses.find((a) => a.id === selectedAddressId);
      finalAddress = chosen ? chosen.address : "";
    }

    setSubmitting(true);
    try {
      const res = await api.post("/customers/orders", {
        productId: selectedProductId,
        requestedQuantity: parseInt(requestedQuantity, 10),
        deliveryAddress: finalAddress,
        deliveryNotes,
        phone,
        paymentOption,
      });

      toast.success(
        paymentOption === "PAY_LATER_MONTHLY"
          ? "Water order submitted! (Postpaid Monthly Credit)"
          : "Water order created successfully!"
      );
      if (res.data?.order?.id) {
        navigate(`/order/${res.data.order.id}`);
      } else {
        navigate("/my-orders");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create water order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Preparing Water Checkout...</div>;
  }

  return (
    <div className="min-h-screen pt-28 pb-16 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create Water Order 💧</h1>
          <p className="text-xs text-slate-500 mt-1">Specify container quantity, delivery address, and payment term</p>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Water Product Selector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">
                1. Select Water Product
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {products.map((prod) => {
                  const img = prod.imageUrl || (prod.name?.toLowerCase().includes("bottle") ? "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80" : "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80");
                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProductId(prod.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        selectedProductId === prod.id
                          ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 ring-2 ring-cyan-500"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <img src={img} alt={prod.name} className="h-16 w-full object-cover rounded-xl mb-2" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{prod.name}</h4>
                      </div>
                      <div className="mt-3 text-lg font-black text-cyan-600">${prod.currentPrice}</div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Requested Quantity *
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRequestedQuantity((q) => Math.max(1, q - 1))}
                    className="h-11 w-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-black text-lg"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    required
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="h-11 w-24 text-center font-black text-lg rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setRequestedQuantity((q) => q + 1)}
                    className="h-11 w-11 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-black text-lg"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Location & Address */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">
                2. Delivery Address & Contact
              </h3>

              {savedAddresses.length > 0 && !useCustomAddress ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase text-slate-500">Select Saved Address</label>
                  {savedAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer flex justify-between items-center ${
                        selectedAddressId === addr.id
                          ? "border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-500"
                          : "border-slate-200"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-xs uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {addr.label}
                        </span>
                        <p className="text-sm font-semibold mt-1">{addr.address}</p>
                      </div>
                      {addr.isDefault && <span className="text-xs font-bold text-cyan-600">Default</span>}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setUseCustomAddress(true)}
                    className="text-xs font-bold text-cyan-600 hover:underline"
                  >
                    + Enter New Custom Location Instead
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase text-slate-500">Custom Delivery Address *</label>
                  <textarea
                    rows={3}
                    required
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Enter full street, district, house/office number, landmarks..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseCustomAddress(false)}
                      className="text-xs font-bold text-cyan-600 hover:underline"
                    >
                      ← Use Saved Address
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Gate code, landmark, delivery instructions..."
                  className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Payment Method / Terms */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-600">
                3. Payment Option & Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setPaymentOption("PAY_NOW")}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-1 ${
                    paymentOption === "PAY_NOW"
                      ? "border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 ring-2 ring-cyan-500"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">💵 Pay Now / On Delivery</span>
                    {paymentOption === "PAY_NOW" && <span className="text-xs font-bold text-cyan-600">Selected</span>}
                  </div>
                  <p className="text-xs text-slate-500">Pay cash or mobile money upon container delivery.</p>
                </div>

                <div
                  onClick={() => setPaymentOption("PAY_LATER_MONTHLY")}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-1 ${
                    paymentOption === "PAY_LATER_MONTHLY"
                      ? "border-purple-500 bg-purple-50/50 dark:bg-purple-950/40 ring-2 ring-purple-500"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">📅 Postpaid Monthly Credit</span>
                    {paymentOption === "PAY_LATER_MONTHLY" && <span className="text-xs font-bold text-purple-600">Selected</span>}
                  </div>
                  <p className="text-xs text-slate-500">Bisha ayaan isku bixinayaa (Pay accumulated total at end of month).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Snapshot & Order Summary Column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Price Breakdown Snapshot
              </h3>

              <div className="space-y-3 text-sm border-b pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Price ({selectedProduct?.unit}):</span>
                  <span className="font-bold">${unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Quantity:</span>
                  <span className="font-bold">{requestedQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Fee:</span>
                  <span className="font-bold">${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-slate-500 font-bold">Payment Term:</span>
                  <span className={`font-bold text-xs ${paymentOption === "PAY_LATER_MONTHLY" ? "text-purple-600" : "text-emerald-600"}`}>
                    {paymentOption === "PAY_LATER_MONTHLY" ? "Postpaid Monthly" : "Pay Now"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-black text-slate-900 dark:text-white">Total Amount:</span>
                <span className="text-3xl font-black text-cyan-600">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-2xl text-base transition shadow-lg shadow-cyan-600/30"
              >
                {submitting ? "Submitting Order..." : "Confirm & Place Water Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
