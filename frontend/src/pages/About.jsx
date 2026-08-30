import { FiShield, FiTruck, FiCheckCircle, FiMessageSquare, FiGlobe, FiSmartphone } from "react-icons/fi";

const About = () => {
  return (
    <div className="bg-slate-50 dark:bg-[#0a0f1d] min-h-screen text-slate-900 dark:text-slate-100 pt-28 pb-20 font-body transition-colors duration-300">
      <div className="container mx-auto px-6 text-left">
        {/* HERO */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 font-extrabold">
                About AgriSmart Platform
              </span>
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl font-black leading-tight text-slate-900 dark:text-white">
              Empowering Somali Farmers with{" "}
              <span className="text-emerald-600 dark:text-emerald-400">Smart Inputs & Mobile Money.</span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              AgriSmart Market is a state-of-the-art digital agricultural ecosystem designed to bridge the gap between farmers, certified seed growers, fertilizer distributors, and agrovet equipment suppliers across Somalia.
            </p>

            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              By integrating local mobile financial services (**Hormuud EVC Plus, Zaad, and Sahal**), our platform ensures transparent pricing, verified quality assurance, and express delivery to remote farming districts.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
              {[
                { label: "Verified Agrovets", val: "250+" },
                { label: "Active Farmers", val: "15,000+" },
                { label: "Mobile Money", val: "EVC / Zaad" },
                { label: "Fulfillments", val: "50,000+" },
              ].map((stat, i) => (
                <div key={i}>
                  <h4 className="font-heading text-3xl font-black text-emerald-600 dark:text-amber-400 mb-1">
                    {stat.val}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-extrabold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-emerald-600/10 dark:bg-amber-500/10 blur-[120px] rounded-full" />
            <div className="relative bg-white dark:bg-slate-900 p-3 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop"
                alt="AgriSmart Marketplace"
                className="rounded-2xl h-[480px] w-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* CORE VALUES */}
        <div className="grid md:grid-cols-4 gap-6 mb-24">
          {[
            {
              icon: <FiShield />,
              title: "Verified Supplier KYC",
              desc: "Every agrovet supplier is vetted with business registration and license verification before listing products.",
            },
            {
              icon: <FiSmartphone />,
              title: "Instant EVC Plus & Zaad",
              desc: "Seamless checkout using your mobile phone number with instant receipt generation and status alerts.",
            },
            {
              icon: <FiTruck />,
              title: "Gu & Dayr Delivery",
              desc: "Timely delivery before the seasonal rains so farmers plant on schedule without supplier delays.",
            },
            {
              icon: <FiMessageSquare />,
              title: "Dispute & Complaint Protection",
              desc: "Built-in support module allowing farmers to report wrong delivery or counterfeit inputs with refund tracking.",
            },
          ].map((val, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl space-y-4 hover:-translate-y-1 transition-all duration-300 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-800 flex items-center justify-center text-2xl text-emerald-600 dark:text-amber-400">
                {val.icon}
              </div>
              <h3 className="font-heading text-lg font-black text-slate-900 dark:text-white">{val.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{val.desc}</p>
            </div>
          ))}
        </div>

        {/* USER ROLES */}
        <div className="text-center space-y-12">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-amber-400">
              Platform Architecture
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
              Who AgriSmart Serves
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 text-left">
            {[
              {
                title: "Farmers (Buyers)",
                desc: "Search hybrid seeds, NPK fertilizers, and solar pumps. Pay via mobile money and track farm delivery.",
                image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?q=80&w=600&auto=format&fit=crop",
              },
              {
                title: "Agrovet Suppliers (Sellers)",
                desc: "List products, receive low stock alerts, process incoming farmer orders, and track payout earnings.",
                image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop",
              },
              {
                title: "Platform Administrators",
                desc: "Approve supplier KYC applications, manage coupons, review dispute reports, and monitor sales analytics.",
                image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=600&auto=format&fit=crop",
              },
            ].map((role, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <img src={role.image} alt={role.title} className="h-52 w-full object-cover" />
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{role.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;