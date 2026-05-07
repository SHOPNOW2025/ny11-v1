import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { MenuItem, UserProfile, MenuCategory } from "../types";
import { formatPrice } from "../lib/currency";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, ShoppingBag, Info, Activity, Zap, Plus, ArrowRight, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function MenuPage({ user, lang }: { user?: UserProfile | null, lang: "ar" | "en" }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categorySettings, setCategorySettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MenuCategory | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const menuSnap = await getDocs(collection(db, "menu"));
      const settingsSnap = await getDocs(collection(db, "category_settings"));
      
      setItems(menuSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem)));
      setCategorySettings(settingsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const categories = [
    { id: "MENU", ar: "قسم المنيو", en: "Dining Menu", icon: <Zap size={20} /> },
    { id: "SUPPLEMENTS", ar: "قسم المكملات الغذائية", en: "Supplements", icon: <Plus size={20} /> },
    { id: "BASIL", ar: "قسم منتجات الريحان", en: "Basil Products", icon: <Activity size={20} /> }
  ];

  const filtered = items.filter(item => 
    (!activeCategory || item.category === activeCategory) &&
    ((item.name?.[lang] || "").includes(search) || (item.description?.[lang] && item.description[lang].includes(search)))
  );

  const t = {
    storeName: lang === "ar" ? "متجر NY11" : "NY11 STORE",
    excellence: lang === "ar" ? "التميز الصحي" : "HEALTHY EXCELLENCE",
    findFuel: lang === "ar" ? "ابحث عن منتج..." : "Search products...",
    orderNow: lang === "ar" ? "إضافة للسلة" : "Add to Cart",
    noMatch: lang === "ar" ? "لا توجد نتائج" : "No Match Found",
    protein: lang === "ar" ? "بروتين" : "Protein",
    carbs: lang === "ar" ? "كارب" : "Carbs",
    fats: lang === "ar" ? "دهون" : "Fats",
    back: lang === "ar" ? "رجوع" : "Back",
    announcement: lang === "ar" ? "🚚 توصيل مجاني للطلبات فوق 50 دينار! تسوق الآن" : "🚚 Free shipping on orders over 50 JOD! Shop Now",
    explore: lang === "ar" ? "اكتشف الأقسام" : "Explore Sections"
  };

  return (
    <div className="flex flex-col flex-1 pb-40 overflow-x-hidden">
      <header className="p-6 pt-10 space-y-8">
        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.div 
              key="main-header"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-1"
            >
              <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{t.excellence}</h2>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase whitespace-pre-line text-[var(--text-main)]">
                {t.storeName}
              </h1>
            </motion.div>
          ) : (
            <motion.div 
              key="category-header"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-4"
            >
              <button 
                onClick={() => setActiveCategory(null)}
                className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-primary"
              >
                <ChevronLeft size={24} className={lang === 'ar' ? 'rotate-180' : ''} />
              </button>
              <div className="space-y-0.5">
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">{t.storeName}</h2>
                <h1 className="text-2xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">
                  {categories.find(c => c.id === activeCategory)?.[lang]}
                </h1>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Store Announcement Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative glass border border-primary/20 rounded-2xl p-4 flex items-center gap-4 overflow-hidden">
             <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0 animate-pulse">
                <Zap size={20} />
             </div>
             <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] font-black uppercase text-primary/60 tracking-wider mb-0.5">Announcement</p>
                <p className="text-xs font-bold text-white/90 truncate italic">{t.announcement}</p>
             </div>
             <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>
        
        {/* Quick Categories Navigation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em]">{t.explore}</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mask-linear-right">
             {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as MenuCategory)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all shrink-0 font-black text-[10px] uppercase tracking-widest ${
                    activeCategory === cat.id 
                    ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-105" 
                    : "glass border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  <span className={activeCategory === cat.id ? "text-black" : "text-primary"}>{cat.icon}</span>
                  {cat[lang]}
                </button>
             ))}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 glass rounded-2xl px-5 py-4 flex items-center gap-4 border-white/5">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder={t.findFuel} 
              className="bg-transparent border-none focus:ring-0 text-sm w-full font-bold placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {!activeCategory ? (
          <div className="grid gap-6">
            {categories.map((cat, idx) => {
              const setting = categorySettings.find(s => s.id === cat.id);
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setActiveCategory(cat.id as MenuCategory)}
                  className="group relative h-48 w-full rounded-[2.5rem] overflow-hidden glass border border-white/10 text-left"
                >
                  <img 
                    src={setting?.image || "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800"} 
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  
                  <div className="relative h-full p-8 flex flex-col justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary transition-all group-hover:text-black">
                      {cat.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Section</p>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white shadow-sm">
                        {cat[lang]}
                      </h3>
                    </div>
                  </div>
                  
                  <div className={`absolute ${lang === 'ar' ? 'left-8' : 'right-8'} bottom-8 p-3 glass rounded-full opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0`}>
                    <ArrowRight size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-8">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-64 glass rounded-[3rem] animate-pulse" />)
            ) : filtered.length > 0 ? (
              filtered.map((item, idx) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id}
                  className="group"
                >
                  <div className="glass rounded-[3rem] overflow-hidden border-white/[0.03] shadow-2xl relative">
                    <Link to={`/menu/${item.id}`} className="block relative h-56 overflow-hidden">
                      <img src={item.image} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000" alt={item.name?.[lang]} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      
                      <div className="absolute top-6 left-6 glass px-5 py-2 rounded-2xl flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest uppercase text-primary">
                          {formatPrice(item.price, user, item.currency)}
                        </span>
                      </div>
                    </Link>

                    <div className="p-7 space-y-6">
                       <div className="space-y-1">
                          <h3 className="text-xl font-black tracking-tighter uppercase text-[var(--text-main)]">{item.name?.[lang]}</h3>
                          <p className="text-xs text-[var(--text-muted)] font-medium leading-relaxed line-clamp-2">{item.description?.[lang]}</p>
                       </div>

                       {item.category === "MENU" && (
                         <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/[0.03]">
                            <MacroItem label={t.protein} value={item.protein} unit="g" />
                            <MacroItem label={t.carbs} value={item.carbs} unit="g" />
                            <MacroItem label={t.fats} value={item.fats} unit="g" />
                         </div>
                       )}

                       <div className="flex gap-3 pt-2">
                          <button 
                            onClick={() => addToCart(item, "MENU")}
                            className="flex-1 primary-gradient text-background-dark font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest"
                          >
                            <ShoppingBag size={16} />
                            {t.orderNow}
                          </button>
                          <Link to={`/menu/${item.id}`} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-primary transition-colors">
                            <ArrowRight size={18} className={lang === 'ar' ? 'rotate-180' : ''} />
                          </Link>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 glass rounded-[3rem] border border-dashed border-white/10">
                 <Info className="mx-auto text-white/10 mb-4" size={48} />
                 <p className="text-white/20 font-black tracking-widest text-[10px] uppercase">{t.noMatch}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function MacroItem({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black tracking-tighter uppercase text-[var(--text-main)]">{value}<span className="text-[10px] font-medium ml-0.5 opacity-30">{unit}</span></p>
    </div>
  );
}
