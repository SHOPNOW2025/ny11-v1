import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, X, Trash2, ShoppingBag, Plus, Minus, CreditCard, ChevronLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/currency";
import { db } from "../lib/firebase";
import { collection, addDoc, doc, updateDoc, increment, query, where, getDocs } from "firebase/firestore";
import { PromoCode } from "../types";
import { Tag } from "lucide-react";

export default function CartPage({ user, lang }: { user: UserProfile | null, lang: "ar" | "en" }) {
    const navigate = useNavigate();
    const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [promoInput, setPromoInput] = useState("");
    const [promoData, setPromoData] = useState<PromoCode | null>(null);
    const [promoError, setPromoError] = useState("");

  const t = {
    walletError: lang === "ar" ? "رصيد المحفظة غير كافٍ!" : "Insufficient wallet balance!",
    success: lang === "ar" ? "تمت عملية الشراء بنجاح!" : "Purchase successful!",
    fail: lang === "ar" ? "فشلت عملية الدفع" : "Payment failed",
    empty: lang === "ar" ? "سلة المشتريات فارغة" : "Your cart is empty",
    emptySub: lang === "ar" ? "ابدأ بإضافة بعض الوجبات أو التحاليل" : "Start adding some meals or lab tests",
    browse: lang === "ar" ? "تصفح المنيو" : "Browse Menu",
    cart: lang === "ar" ? "سلة المشتريات" : "Shopping Cart",
    items: lang === "ar" ? "منتجات" : "items",
    subtotal: lang === "ar" ? "المجموع الفرعي" : "Subtotal",
    paying: lang === "ar" ? "جاري الدفع..." : "Paying...",
    checkout: lang === "ar" ? "إتمام الشراء" : "Complete Purchase",
    purchaseDesc: lang === "ar" ? (n: number) => `شراء ${n} منتجات` : (n: number) => `Purchase ${n} items`,
    promoLabel: lang === "ar" ? "كود الخصم" : "Promo Code",
    apply: lang === "ar" ? "تطبيق" : "Apply",
    promoInvalid: lang === "ar" ? "كود غير صالح أو منتهي" : "Invalid or expired code",
    promoMinOrder: lang === "ar" ? (val: string) => `أقل قيمة للطلب ${val}` : (val: string) => `Min order value ${val}`,
    discountTitle: lang === "ar" ? "الخصم" : "Discount",
    promoSuccess: lang === "ar" ? "تم تطبيق الخصم!" : "Discount applied!",
    finalTotal: lang === "ar" ? "الإجمالي النهائي" : "Total"
  };

  const handleApplyPromo = async () => {
    if (!promoInput) return;
    setLoading(true);
    setPromoError("");
    try {
        const q = query(collection(db, "promo_codes"), where("code", "==", promoInput.toUpperCase()), where("isActive", "==", true));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            setPromoError(t.promoInvalid);
            setPromoData(null);
        } else {
            const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as PromoCode;
            const now = Date.now();
            
            if (data.expiryDate && data.expiryDate < now) {
                setPromoError(t.promoInvalid);
                setPromoData(null);
            } else if (data.minOrderValue && total < data.minOrderValue) {
                setPromoError(t.promoMinOrder(formatPrice(data.minOrderValue, user)));
                setPromoData(null);
            } else if (data.usageLimit && data.usageCount >= data.usageLimit) {
                setPromoError(t.promoInvalid);
                setPromoData(null);
            } else {
                setPromoData(data);
                setPromoError("");
            }
        }
    } catch (err) {
        console.error(err);
        setPromoError(t.promoInvalid);
    }
    setLoading(false);
  };

  const discountAmount = promoData ? (
    promoData.discountType === "PERCENTAGE" 
        ? Math.min(total * (promoData.discountValue / 100), promoData.maxDiscount || Infinity)
        : promoData.discountValue
  ) : 0;

  const finalTotalValue = Math.max(0, total - discountAmount);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const orderData = {
      userName: user.name,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        currency: item.currency || "JOD",
        image: item.image || null,
        type: item.type,
        quantity: item.quantity
      })),
      total: finalTotalValue,
      originalTotal: total,
      discount: discountAmount,
      promoCode: promoData?.code || null
    };

    navigate("/payment", {
      state: {
        amount: finalTotalValue,
        currency: items[0]?.currency || "JOD",
        type: "ORDER",
        orderData
      }
    });

    if (promoData) {
        await updateDoc(doc(db, "promo_codes", promoData.id), {
            usageCount: (promoData.usageCount || 0) + 1
        });
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-24 h-24 glass rounded-[2.5rem] flex items-center justify-center text-[var(--text-muted)] opacity-20">
          <ShoppingBag size={48} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{t.empty}</h2>
          <p className="text-[var(--text-muted)] text-xs mt-1">{t.emptySub}</p>
        </div>
        <button 
          onClick={() => navigate("/menu")}
          className="primary-gradient text-background-dark px-10 py-4 rounded-2xl font-bold text-sm shadow-xl"
        >
          {t.browse}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-12 pb-32">
      <div className="px-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-[var(--text-muted)] border-[var(--border-muted)]">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">{t.cart}</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{items.length} {t.items}</p>
        </div>
        <div className="w-12" />
      </div>

      <div className="px-6 space-y-4 flex-1 overflow-y-auto no-scrollbar pb-12">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-3xl p-4 flex gap-4 items-center border-[var(--border-muted)]"
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden glass shrink-0">
                {item.image ? (
                  <img src={item.image} className="w-full h-full object-cover" alt={typeof item.name === 'object' ? item.name[lang] : item.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                    <ShoppingBag size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm truncate pr-2 text-[var(--text-main)]">
                    {typeof item.name === 'object' ? item.name[lang] : item.name}
                  </h3>
                  <button onClick={() => removeFromCart(item.id)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-primary mt-1">{formatPrice(item.price, user, item.currency)}</p>
                
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center glass rounded-xl border-[var(--border-muted)] px-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]"><Minus size={14} /></button>
                    <span className="w-8 text-center text-xs font-bold text-[var(--text-main)]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)]"><Plus size={14} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-4 bg-[var(--bg-main)]/80 backdrop-blur-xl border-t border-[var(--border-muted)]">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 glass rounded-2xl px-4 py-3 border-[var(--border-muted)] flex items-center gap-3">
              <Tag size={16} className="text-primary" />
              <input 
                type="text" 
                placeholder={t.promoLabel}
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-bold uppercase placeholder:text-[var(--text-muted)]"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              />
            </div>
            <button 
                onClick={handleApplyPromo}
                disabled={!promoInput || loading}
                className="glass border-[var(--border-muted)] px-6 rounded-2xl text-[10px] font-black uppercase text-primary active:scale-95 transition-all disabled:opacity-30"
            >
                {t.apply}
            </button>
          </div>
          
          {promoError && <p className="text-[10px] font-bold text-red-500 px-2">{promoError}</p>}
          {promoData && <p className="text-[10px] font-bold text-primary px-2">{t.promoSuccess}</p>}

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] px-2 uppercase font-black tracking-widest">
              <span>{t.subtotal}</span>
              <span>{formatPrice(total, user)}</span>
            </div>
            {discountAmount > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex justify-between text-[10px] text-primary px-2 uppercase font-black tracking-widest">
                    <span>{t.discountTitle} ({promoData?.code})</span>
                    <span>-{formatPrice(discountAmount, user)}</span>
                </motion.div>
            )}
            <div className="flex justify-between text-sm text-[var(--text-main)] px-2 uppercase font-black tracking-widest pt-2 border-t border-white/5">
              <span>{t.finalTotal}</span>
              <span>{formatPrice(finalTotalValue, user)}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCheckout}
          disabled={loading}
          className="w-full primary-gradient text-background-dark py-6 rounded-3xl font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-pulse">{t.paying}</span>
          ) : (
            <>
              <CreditCard size={20} />
              {t.checkout} • {formatPrice(finalTotalValue, user)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
