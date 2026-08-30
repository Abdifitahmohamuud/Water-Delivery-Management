import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiSun, FiCloudRain, FiZap } from "react-icons/fi";

const Collection = () => {
  const navigate = useNavigate();

  const seasonalCollections = [
    {
      season: "Gu Season (Apr – Jun)",
      title: "Main Planting & Certified Seeds",
      desc: "Certified high-germination hybrid seeds, NPK soil nutrients, and land preparation tools for Somalia's primary rainy season.",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop",
      tag: "Main Season",
      link: "/shop?category=SEEDS",
      focus: "Seeds & Fertilizers",
    },
    {
      season: "Xagaa Season (Jul – Sep)",
      title: "Crop Protection & Pest Sprays",
      desc: "Registered crop protection sprays, insect traps, and fungicides to safeguard standing crops during the dry post-Gu period.",
      image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=1200&auto=format&fit=crop",
      tag: "Protection",
      link: "/shop?category=PESTICIDES",
      focus: "Pesticides & Sprayers",
    },
    {
      season: "Dayr Season (Oct – Dec)",
      title: "Second Planting & Quick-Cycle Crops",
      desc: "Quick-maturing seeds, foliar bio-fertilizers, and water harvesting tools for the secondary rainfall season.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
      tag: "Secondary Season",
      link: "/shop?category=FERTILIZERS",
      focus: "Bio-Nutrients & Seeds",
    },
    {
      season: "Jiilaal Season (Jan – Mar)",
      title: "Solar Irrigation & Water Conservation",
      desc: "Solar water pumps, drip irrigation kits, polypipes, and water storage tanks to maintain crops during dry months.",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1200&auto=format&fit=crop",
      tag: "Irrigation Focus",
      link: "/shop?category=IRRIGATION_EQUIPMENT",
      focus: "Pumps & Drip Kits",
    },
  ];

  return (
    <div className="min-h-screen bg-[color:var(--bg-main)] text-[color:var(--text-main)] pt-28 pb-20 font-body transition-colors duration-300">
      <div className="container mx-auto px-6 text-left">
        {/* Header Title */}
        <div className="max-w-3xl mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-[color:var(--surface-soft)] border border-[color:var(--border-color)] rounded-full shadow-sm">
            <span className="w-2.5 h-2.5 bg-[color:var(--accent)] rounded-full animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-[color:var(--primary)] font-black">
              Somali Agricultural Seasons Guide
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-heading text-[color:var(--text-main)] leading-tight">
            Seasonal Input <br />
            <span className="text-[color:var(--primary)] underline decoration-[color:var(--accent)]/40">
              Collections & Catalog.
            </span>
          </h1>

          <p className="text-[color:var(--text-muted)] text-base sm:text-lg leading-relaxed">
            Align your crop purchases with the Somali agricultural calendar. Explore curated inputs specifically suited for the Gu, Xagaa, Dayr, and Jiilaal farming periods.
          </p>
        </div>

        {/* Seasonal Grid */}
        <div className="grid lg:grid-cols-2 gap-10">
          {seasonalCollections.map((col, i) => (
            <div
              key={i}
              className="group relative h-[520px] rounded-3xl overflow-hidden bg-[color:var(--bg-card-solid)] border border-[color:var(--border-color)] shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-end"
            >
              <img
                src={col.image}
                alt={col.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061009]/95 via-[#061009]/60 to-transparent" />

              <div className="relative z-10 p-8 space-y-4 text-white">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-[color:var(--accent)] text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                    {col.tag}
                  </span>
                  <span className="text-xs font-bold text-[color:var(--primary)] uppercase tracking-wider">
                    {col.season}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black font-heading leading-snug group-hover:text-[color:var(--accent)] transition-colors">
                  {col.title}
                </h2>

                <p className="text-[color:var(--text-muted)] text-xs sm:text-sm line-clamp-2 leading-relaxed">
                  {col.desc}
                </p>

                <div className="pt-2">
                  <Link
                    to={col.link}
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[color:var(--primary)] hover:text-[color:var(--accent)] transition-colors"
                  >
                    <span>Shop {col.focus}</span>
                    <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Need Help Banner */}
        <div className="mt-20 p-12 bg-[color:var(--bg-card-solid)] rounded-3xl border border-[color:var(--border-color)] text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h3 className="text-3xl font-black font-heading text-[color:var(--text-main)]">
              Need Assistance Selecting Farm Inputs?
            </h3>
            <p className="text-[color:var(--text-muted)] text-sm leading-relaxed">
              Consult our verified agrovet suppliers or contact our customer support for advice on seed varieties, fertilizer dosage, and EVC Plus checkout.
            </p>
          </div>
          <button
            onClick={() => navigate("/shop")}
            className="px-8 py-4 rounded-full bg-[color:var(--primary)] hover:bg-[color:var(--primary-hover)] text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/20 relative z-10"
          >
            Explore Market Store
          </button>
        </div>
      </div>
    </div>
  );
};

export default Collection;
