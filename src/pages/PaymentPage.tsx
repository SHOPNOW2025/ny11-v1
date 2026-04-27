import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, CreditCard, ShieldCheck, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { UserProfile } from "../types";
import { db } from "../lib/firebase";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { formatPrice } from "../lib/currency";
import { useCart } from "../context/CartContext";

export default function PaymentPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { amount, currency, quoteId, expertId, chatId, quoteMsgId, type, orderData, testData } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: ""
  });

  const t = {
    title: lang === "ar" ? "الدفع الآمن" : "Secure Payment",
    cardNumber: lang === "ar" ? "رقم البطاقة" : "Card Number",
    cardHolder: lang === "ar" ? "اسم صاحب البطاقة" : "Cardholder Name",
    expiry: lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date",
    cvc: lang === "ar" ? "الرمز (CVC)" : "CVC",
    summary: lang === "ar" ? "ملخص العملية" : "Payment Summary",
    total: lang === "ar" ? "المجموع الكلي" : "Total Amount",
    payNow: lang === "ar" ? "ادفع الآن" : "Pay Now",
    processing: lang === "ar" ? "جاري المعالجة..." : "Processing...",
    secureInfo: lang === "ar" ? "بياناتك مشفرة ومحمية بالكامل" : "Your data is fully encrypted and protected",
    successMsg: lang === "ar" ? "تمت عملية الدفع بنجاح!" : "Payment successful!",
    back: lang === "ar" ? "العودة للدردشة" : "Back to Chat",
    redirecting: lang === "ar" ? "جاري توجيهك..." : "Redirecting you...",
    mastercard: "MASTERCARD",
    visa: "VISA"
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      // Simulate bank delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 1. Log the transaction
      await addDoc(collection(db, "payments"), {
        userId: user.uid,
        amount: amount,
        currency: currency || "JOD",
        type: type || "CARD_PAYMENT",
        timestamp: Date.now(),
        status: "SUCCESS"
      });

      if (type === "QUOTE" && chatId && expertId) {
        // Update the expert's wallet
        const expertRef = doc(db, "users", expertId);
        await updateDoc(expertRef, {
          walletBalance: increment(amount)
        });

        // Mark the quote as accepted in the chat
        if (quoteMsgId) {
          await updateDoc(doc(db, "chats", chatId, "messages", quoteMsgId), { 
              type: "TEXT", 
              text: lang === "ar" ? "تم قبول عرض السعر والدفع عبر البطاقة ✅" : "Quote accepted and paid via Card ✅" 
          });
        }
      } else if (type === "ORDER" && orderData) {
        // Create Order
        await addDoc(collection(db, "orders"), {
          ...orderData,
          userId: user.uid,
          timestamp: Date.now(),
          status: "PAID",
          paymentMethod: "CARD"
        });
        clearCart();
      } else if (type === "LAB_TEST" && testData) {
        // Create an order for a single lab test
        await addDoc(collection(db, "orders"), {
          userId: user.uid,
          userName: user.name,
          items: [{
            id: testData.id,
            name: testData.name,
            price: testData.price,
            currency: testData.currency || "JOD",
            type: "LAB",
            quantity: 1
          }],
          total: amount,
          timestamp: Date.now(),
          status: "PAID",
          paymentMethod: "CARD"
        });
      }

      setSuccess(true);
      setTimeout(() => {
        if (type === "QUOTE") {
          navigate(`/chat/${chatId}`);
        } else {
          navigate("/orders");
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      alert(lang === "ar" ? "فشلت العملية، يرجى المحاولة لاحقاً" : "Payment failed, please try again");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-black"
        >
            <CheckCircle2 size={48} />
        </motion.div>
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{t.successMsg}</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.processing}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-12 pb-32" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="px-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white/40">
          <ChevronLeft size={20} className={lang === 'en' ? 'rotate-180' : ''} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">{t.title}</h1>
        </div>
        <div className="w-12" />
      </header>

      <main className="px-6 space-y-8">
        {/* Visual Card Section */}
        <div className="relative h-48 w-full perspective-1000">
            <motion.div 
                className="w-full h-full primary-gradient rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                whileHover={{ rotateY: 5 }}
            >
                <div className="flex justify-between items-start">
                    <div className="w-12 h-10 bg-black/20 rounded-lg flex items-center justify-center">
                        <CreditCard size={24} className="text-black/40" />
                    </div>
                    <div className="text-[10px] font-black text-black/40 italic uppercase tracking-widest">
                        {cardData.number.startsWith('4') ? t.visa : t.mastercard}
                    </div>
                </div>
                
                <div className="space-y-4">
                    <p className="text-xl font-black text-black/80 tracking-[0.2em] font-mono">
                        {cardData.number || "**** **** **** ****"}
                    </p>
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest">{t.cardHolder}</p>
                            <p className="text-xs font-black text-black/80 uppercase italic">{cardData.name || "YOUR NAME"}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest">{t.expiry}</p>
                            <p className="text-xs font-black text-black/80">{cardData.expiry || "**/**"}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
            <div className="space-y-4">
                <InputField 
                    label={t.cardNumber} 
                    value={cardData.number} 
                    placeholder="0000 0000 0000 0000"
                    onChange={(v: string) => setCardData({...cardData, number: v.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)})} 
                />
                <InputField 
                    label={t.cardHolder} 
                    value={cardData.name} 
                    placeholder="CARDHOLDER NAME"
                    onChange={(v: string) => setCardData({...cardData, name: v})} 
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputField 
                        label={t.expiry} 
                        value={cardData.expiry} 
                        placeholder="MM / YY"
                        onChange={(v: string) => setCardData({...cardData, expiry: v.replace(/\//g, '').replace(/(\d{2})/, '$1 / ').trim().slice(0, 7)})} 
                    />
                    <InputField 
                        label={t.cvc} 
                        value={cardData.cvc} 
                        placeholder="123"
                        type="password"
                        onChange={(v: string) => setCardData({...cardData, cvc: v.slice(0, 3)})} 
                    />
                </div>
            </div>

            <div className="glass p-6 rounded-3xl space-y-3 bg-white/5 border-white/5">
                <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    <span>{t.summary}</span>
                    <span>{t.total}</span>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <Lock size={14} className="text-primary" />
                        <span className="text-[10px] font-bold text-white/60">{t.secureInfo}</span>
                    </div>
                    <span className="text-2xl font-black text-primary italic">{formatPrice(amount, user, currency)}</span>
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                {loading ? t.processing : t.payNow}
            </button>
        </form>
      </main>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">{label}</label>
            <div className="glass rounded-2xl px-5 border border-white/5 focus-within:border-primary/50 transition-all">
                <input 
                    type={type} 
                    className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 font-bold placeholder:text-white/10" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required
                />
            </div>
        </div>
    );
}
