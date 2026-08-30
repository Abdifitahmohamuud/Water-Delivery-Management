import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  CircleDollarSign,
  Package2,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const SupplierDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["supplier-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/supplier/dashboard");
      return data;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: async () => {
      const { data } = await api.get("/auth/profile");
      return data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["supplier-products-list"],
    queryFn: async () => {
      if (!profileData?.id) return [];
      const { data } = await api.get(`/products?supplierId=${profileData.id}`);
      return data;
    },
    enabled: !!profileData?.id,
  });

  if (isLoading) {
    return (
      <div className="dashboard-panel flex h-96 flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--border-color)] border-t-[color:var(--accent)]" />
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[color:var(--text-muted)]">
          Loading supplier reports
        </p>
      </div>
    );
  }

  const grossRevenue = parseFloat(stats?.revenue || 0);
  const netEarnings = Number(stats?.netRevenue ?? grossRevenue);
  const areaData = stats?.monthlyRevenue || [
    { month: "Jan", revenue: 900 },
    { month: "Feb", revenue: 1500 },
    { month: "Mar", revenue: 2200 },
    { month: "Apr", revenue: 2100 },
    { month: "May", revenue: 3100 },
    { month: "Jun", revenue: 3900 },
  ];

  const cards = [
    { label: "Gross revenue", value: `$${grossRevenue.toFixed(2)}`, note: "Total business sales", icon: CircleDollarSign, accent: "text-[color:var(--primary)]" },
    { label: "Net earnings", value: `$${netEarnings.toFixed(2)}`, note: "After estimated commission", icon: TrendingUp, accent: "text-[color:var(--accent)]" },
    { label: "Orders", value: stats?.ordersCount || 0, note: "Customer fulfillments", icon: ShoppingCart, accent: "text-[color:var(--primary)]" },
    { label: "Products", value: productsData?.length || 0, note: "Listed and searchable", icon: Boxes, accent: "text-[color:var(--accent)]" },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div className="dashboard-toolbar">
        <div className="text-left">
          <span className="section-eyebrow">
            <ShieldCheck className="h-3.5 w-3.5" />
            Supplier workspace
          </span>
          <h1 className="mt-4">Business reports and product performance</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">
            Monitor daily sales, fulfillment activity, and catalog momentum from a single, simplified dashboard.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/supplier/products" className="inline-flex items-center gap-2 rounded-full bg-[color:var(--primary)] px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-[color:var(--primary-hover)]">
            Add product
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/supplier/orders" className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--text-main)] transition hover:border-[color:var(--primary)]">
            View orders
          </Link>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="dashboard-card">
              <div className="metric-row">
                <div className="stat-card__icon">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="brand-pill">{card.label}</span>
              </div>
              <p className="dashboard-card__label mt-5">{card.label}</p>
              <h2 className={`dashboard-card__value ${card.accent}`}>{card.value}</h2>
              <p className="dashboard-card__meta">{card.note}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="dashboard-panel">
          <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border-color)] pb-4">
            <div className="text-left">
              <h3 className="text-xl font-black text-[color:var(--text-main)]">Revenue flow</h3>
              <p className="text-xs text-[color:var(--text-muted)]">Monthly sales trajectory</p>
            </div>
            <BarChart3 className="h-6 w-6 text-[color:var(--primary)]" />
          </div>

          <div className="h-80 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,32,22,0.12)" />
                <XAxis dataKey="month" stroke="rgba(91,102,92,0.9)" fontSize={12} />
                <YAxis stroke="rgba(91,102,92,0.9)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.96)",
                    borderColor: "rgba(20,32,22,0.12)",
                    borderRadius: 16,
                    color: "#142016",
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="rgba(30,111,61,0.18)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-panel space-y-4">
          <div className="flex items-center justify-between border-b border-[color:var(--border-color)] pb-4">
            <div className="text-left">
              <h3 className="text-xl font-black text-[color:var(--text-main)]">Supplier status</h3>
              <p className="text-xs text-[color:var(--text-muted)]">Quick snapshot</p>
            </div>
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-4">
            <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--primary)]">Verification</p>
                  <p className="text-sm text-[color:var(--text-muted)]">Business profile active</p>
                </div>
                <BadgeCheck className="h-6 w-6 text-emerald-500" />
              </div>
            </div>

            <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-soft)] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[color:var(--primary)]">Net earnings</p>
              <p className="mt-2 text-3xl font-black text-[color:var(--text-main)]">${netEarnings.toFixed(2)}</p>
              <p className="mt-2 text-sm text-[color:var(--text-muted)]">Estimated 95% payout rate.</p>
            </div>

            <Link
              to="/supplier/profile"
              className="flex items-center justify-between bg-[color:var(--primary)] px-4 py-4 text-white transition hover:bg-[color:var(--primary-hover)]"
            >
              <span className="text-sm font-black uppercase tracking-[0.18em]">Update profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="flex items-center justify-between border-b border-[color:var(--border-color)] pb-4">
          <div className="text-left"><h3 className="text-xl font-black text-[color:var(--text-main)]">Transactions and finance</h3><p className="text-xs text-[color:var(--text-muted)]">Your recorded payments, refunds, and net earnings</p></div>
          <CircleDollarSign className="h-5 w-5 text-[color:var(--primary)]" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="dashboard-card__label">Payments</p><p className="dashboard-card__value text-[color:var(--primary)]">${grossRevenue.toFixed(2)}</p></div><div><p className="dashboard-card__label">Refunds</p><p className="dashboard-card__value text-red-500">${Number(stats?.refunds || 0).toFixed(2)}</p></div><div><p className="dashboard-card__label">Net</p><p className="dashboard-card__value text-[color:var(--accent)]">${netEarnings.toFixed(2)}</p></div></div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]"><tr><th className="pb-3">Type</th><th className="pb-3">Order</th><th className="pb-3">Amount</th><th className="pb-3">Date</th></tr></thead><tbody>{(stats?.transactions || []).map((transaction) => <tr key={transaction.id} className="border-t border-[color:var(--border-color)]"><td className="py-3 font-bold">{transaction.type}</td><td className="py-3">#{transaction.orderId?.slice(0, 8)}</td><td className="py-3 font-black">${Number(transaction.amount || 0).toFixed(2)}</td><td className="py-3 text-[color:var(--text-muted)]">{new Date(transaction.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
};

export default SupplierDashboard;
