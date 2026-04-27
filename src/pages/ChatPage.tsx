import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { ChatMessage, ChatRoom, UserProfile, Expert } from "../types";
import { formatPrice } from "../lib/currency";
import { getLocalizedString } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Send, ChevronRight, MoreVertical, Paperclip, Bot, User, Trophy, FlaskConical, DollarSign, CreditCard } from "lucide-react";
import { getAiHealthAdvice } from "../services/aiAssistant";

export default function ChatPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [expert, setExpert] = useState<Expert | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState<{msgId: string; amount: number; currency: string} | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteValue, setQuoteValue] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("JOD");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let unsubExpert: (() => void) | undefined;

    const unsubRoom = onSnapshot(doc(db, "chats", id), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ChatRoom;
        setRoom({ id: snap.id, ...data });
        
        if (data.type === "EXPERT" && data.expertId) {
          if (unsubExpert) unsubExpert();
          unsubExpert = onSnapshot(doc(db, "users", data.expertId), (eSnap) => {
            if (eSnap.exists()) {
              setExpert({ id: eSnap.id, ...eSnap.data() } as Expert);
            }
          });
        }
      }
    });

    const q = query(collection(db, "chats", id, "messages"), orderBy("timestamp", "asc"));
    const unsubMsg = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    });

    return () => {
      unsubRoom();
      unsubMsg();
      if (unsubExpert) unsubExpert();
    };
  }, [id]);

  const t = {
    loading: lang === "ar" ? "جارِ التحميل..." : "Loading...",
    aiAssistant: lang === "ar" ? "المساعد الصحي الذكي" : "Smart Health Assistant",
    alwaysOnline: lang === "ar" ? "متصل دائماً" : "Always Online",
    trainer: lang === "ar" ? "مدرب لياقة" : "Fitness Trainer",
    labManager: lang === "ar" ? "مدير مختبر" : "Lab Manager",
    customQuote: lang === "ar" ? "عرض سعر مخصص" : "Custom Quote",
    acceptPay: lang === "ar" ? "قبول والدفع الآن" : "Accept & Pay Now",
    typeMessage: lang === "ar" ? "اكتب رسالتك هنا..." : "Type your message here...",
    sendQuote: lang === "ar" ? "ارسال عرض سعر" : "Send Quote",
    quoteValuePrompt: lang === "ar" ? "أدخل قيمة عرض السعر:" : "Enter quote value:",
    currencyPrompt: lang === "ar" ? "أدخل العملة (JOD/USD):" : "Enter currency (JOD/USD):",
    quoteSentMsg: lang === "ar" ? (price: string) => `تم إرسال عرض سعر بقيمة ${price}.` : (price: string) => `Quote sent for ${price}.`,
    insufficientWallet: lang === "ar" ? "رصيد محفظتك غير كافٍ" : "Insufficient wallet balance",
    confirmAccept: lang === "ar" ? "هل تريد قبول عرض السعر هذا؟ سيتم خصم المبلغ من محفظتك." : "Do you want to accept this quote? The amount will be deducted from your wallet.",
    quoteAcceptedMsg: lang === "ar" ? "تم قبول عرض السعر بنجاح ✅" : "Quote accepted successfully ✅",
    paymentSuccess: lang === "ar" ? "تم الدفع بنجاح" : "Payment successful",
    choosePayment: lang === "ar" ? "اختر طريقة الدفع" : "Choose Payment Method",
    payWithWallet: lang === "ar" ? "الدفع عبر المحفظة" : "Pay from Wallet",
    payWithCard: lang === "ar" ? "الدفع عبر البطاقة (Visa/MasterCard)" : "Pay with Card (Visa/MasterCard)",
    walletBalanceInfo: (bal: string) => lang === "ar" ? `رصيدك الحالي: ${bal}` : `Current Balance: ${bal}`,
    cancel: lang === "ar" ? "إلغاء" : "Cancel"
  };

  const sendMessage = async () => {
    if (!text.trim() || !id || !room) return;
    
    const msgText = text;
    setText("");

    const msgData = {
      senderId: user.uid,
      text: msgText,
      timestamp: Date.now(),
      type: "TEXT" as const
    };

    await addDoc(collection(db, "chats", id, "messages"), msgData);
    await updateDoc(doc(db, "chats", id), {
        lastMessage: msgText,
        updatedAt: Date.now()
    });

    if (room.type === "AI") {
        setIsAiLoading(true);
        const history = messages.map(m => ({
            role: m.senderId === user.uid ? "user" : "model",
            parts: [{ text: m.text }]
        }));
        const prompt = lang === "ar" 
          ? `${msgText} (يرجى الرد باللغة العربية)`
          : `${msgText} (Please respond in English)`;
        const aiResponse = await getAiHealthAdvice(prompt, history);
        
        await addDoc(collection(db, "chats", id, "messages"), {
            senderId: "AI",
            text: aiResponse,
            timestamp: Date.now(),
            type: "TEXT"
        });
        
        await updateDoc(doc(db, "chats", id), {
            lastMessage: aiResponse,
            updatedAt: Date.now()
        });
        setIsAiLoading(false);
    }
  };

  const sendQuote = async () => {
    if (!quoteValue || isNaN(parseFloat(quoteValue))) return;
    
    if (!id || !room) return;

    const baseAmount = parseFloat(quoteValue);
    const quoteMsgLabel = t.quoteSentMsg(formatPrice(baseAmount, user, quoteCurrency as any));
    
    await addDoc(collection(db, "chats", id, "messages"), {
      senderId: user.uid,
      text: quoteMsgLabel,
      timestamp: Date.now(),
      type: "QUOTE",
      quoteAmount: baseAmount,
      quoteCurrency: quoteCurrency
    });

    await updateDoc(doc(db, "chats", id), {
        lastMessage: quoteMsgLabel,
        updatedAt: Date.now()
    });
    
    setShowQuoteModal(false);
    setQuoteValue("");
  };

  const handleWalletPayment = async () => {
    if (!showPaymentChoice) return;
    const { msgId, amount } = showPaymentChoice;

    if (user.walletBalance < amount) {
        alert(t.insufficientWallet);
        return;
    }
    
    if (!confirm(t.confirmAccept)) return;

    try {
        setLoading(true);
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { walletBalance: user.walletBalance - amount });
        
        if (room?.expertId) {
            const expertRef = doc(db, "users", room.expertId);
            const expertSnap = await getDoc(expertRef);
            if (expertSnap.exists()) {
                await updateDoc(expertRef, { walletBalance: (expertSnap.data().walletBalance || 0) + amount });
            }
        }

        await updateDoc(doc(db, "chats", id!, "messages", msgId), { type: "TEXT", text: t.quoteAcceptedMsg });
        alert(t.paymentSuccess);
        setShowPaymentChoice(null);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleCardPayment = () => {
    if (!showPaymentChoice || !room) return;
    navigate("/payment", { 
        state: { 
            amount: showPaymentChoice.amount, 
            currency: showPaymentChoice.currency,
            quoteId: showPaymentChoice.msgId,
            expertId: room.expertId,
            chatId: id,
            quoteMsgId: showPaymentChoice.msgId
        } 
    });
  };

  if (!room) return <div className="p-8 text-center opacity-30">{t.loading}</div>;

  return (
    <div className="flex flex-col h-screen bg-[#0a0c10] relative z-[60]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/5 glass sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center">
            {lang === 'ar' ? <ChevronRight size={20} /> : <ChevronRight size={20} className="rotate-180" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden glass p-0.5 relative">
              {room.type === "AI" ? (
                <div className="w-full h-full bg-primary flex items-center justify-center text-background-dark">
                  <Bot size={20} />
                </div>
              ) : (
                <img src={expert?.image} className="w-full h-full object-cover rounded-[10px]" alt="" />
              )}
              {expert?.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-background-dark rounded-full"></div>}
            </div>
            <div>
              <h1 className="text-sm font-bold">{room.type === "AI" ? t.aiAssistant : getLocalizedString(expert?.name, lang)}</h1>
              <p className="text-[10px] text-primary">{room.type === "AI" ? t.alwaysOnline : (expert?.role === "TRAINER" ? t.trainer : t.labManager)}</p>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/40">
          <MoreVertical size={18} />
        </button>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              key={m.id}
              className={`flex ${m.senderId === user.uid ? (lang === 'ar' ? "justify-start" : "justify-end") : (lang === 'ar' ? "justify-end" : "justify-start")}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.senderId === user.uid 
                  ? "bg-primary text-black rounded-tr-none font-medium" 
                  : "glass text-white rounded-tl-none border border-white/5"
              }`}>
                {m.type === "QUOTE" ? (
                    <div className="space-y-3">
                        <p className="font-bold flex items-center gap-2"><DollarSign size={14}/> {t.customQuote}</p>
                        <p className="text-xl font-black">{formatPrice(m.quoteAmount || 0, user, (m as any).quoteCurrency)}</p>
                        {m.senderId !== user.uid && (
                            <button 
                                onClick={() => setShowPaymentChoice({ msgId: m.id, amount: m.quoteAmount || 0, currency: (m as any).quoteCurrency })}
                                className="w-full bg-primary text-black py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-primary/20"
                            >
                                {t.acceptPay}
                            </button>
                        )}
                    </div>
                ) : m.text}
                <p className={`text-[8px] mt-1 opacity-40 ${m.senderId === user.uid ? "text-black" : "text-white"}`}>
                    {new Date(m.timestamp).toLocaleTimeString(lang === 'ar' ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
          {isAiLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex ${lang === 'ar' ? 'justify-end' : 'justify-start'}`}>
                <div className="glass p-4 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-75"></div>
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-150"></div>
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showPaymentChoice && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ y: 100 }} 
                    animate={{ y: 0 }} 
                    exit={{ y: 100 }}
                    className="w-full max-w-lg glass bg-background-dark rounded-[3rem] p-8 space-y-6 border border-white/10"
                >
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">{t.choosePayment}</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{formatPrice(showPaymentChoice.amount, user, showPaymentChoice.currency as any)}</p>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleWalletPayment}
                            className="w-full glass p-6 rounded-3xl border border-white/5 hover:border-primary/50 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <DollarSign size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm">{t.payWithWallet}</p>
                                    <p className="text-[10px] text-white/30">{t.walletBalanceInfo(formatPrice(user.walletBalance, user))}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className={lang === 'en' ? 'rotate-180' : ''} />
                        </button>

                        <button 
                            onClick={handleCardPayment}
                            className="w-full glass p-6 rounded-3xl border border-white/5 hover:border-primary/50 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 text-white/40 flex items-center justify-center group-hover:text-white transition-colors">
                                    <CreditCard size={24} />
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm">{t.payWithCard}</p>
                                    <p className="text-[10px] text-white/30">Visa, Mastercard</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className={lang === 'en' ? 'rotate-180' : ''} />
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowPaymentChoice(null)}
                        className="w-full py-4 text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors"
                    >
                        {t.cancel}
                    </button>
                </motion.div>
            </motion.div>
        )}

        {showQuoteModal && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-sm glass bg-background-dark rounded-[2.5rem] p-8 space-y-6 border border-white/10"
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <DollarSign size={32} />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">{t.customQuote}</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">{t.quoteValuePrompt}</label>
                             <div className="bg-white/5 rounded-2xl p-4 border border-white/10 focus-within:border-primary transition-all">
                                <input 
                                    type="number" 
                                    className="bg-transparent border-none focus:ring-0 w-full font-black text-xl text-primary" 
                                    placeholder="0.00"
                                    value={quoteValue}
                                    onChange={(e) => setQuoteValue(e.target.value)}
                                />
                             </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">{t.currencyPrompt}</label>
                             <div className="flex gap-2">
                                {["JOD", "USD"].map(curr => (
                                    <button 
                                        key={curr}
                                        onClick={() => setQuoteCurrency(curr)}
                                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${quoteCurrency === curr ? 'bg-primary text-black' : 'bg-white/5 text-white/40 border border-white/10'}`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowQuoteModal(false)}
                            className="flex-1 py-4 text-[10px] font-black uppercase text-white/40 tracking-widest"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            onClick={sendQuote}
                            className="flex-[2] bg-primary text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            {t.sendQuote}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Input */}
      <footer className="p-4 pb-8 space-y-4 bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
            {(user.role === "TRAINER" || user.role === "LAB_MANAGER") && room.type === "EXPERT" && (
                <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="w-14 h-14 glass text-primary rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all border border-primary/20"
                    title={t.sendQuote}
                >
                    <DollarSign size={20} />
                </button>
            )}
            <div className="flex-1 glass rounded-2xl flex items-center px-4 py-1 border border-white/5 focus-within:border-primary/50 transition-all">
                <input 
                    type="text" 
                    placeholder={t.typeMessage}
                    className="bg-transparent border-none focus:ring-0 text-sm flex-1 py-4"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button className="text-white/20 hover:text-primary transition-colors">
                    <Paperclip size={18} />
                </button>
            </div>
            <button 
                onClick={sendMessage}
                className="w-14 h-14 bg-primary text-black rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-90 transition-all"
            >
                <Send size={20} className={lang === 'ar' ? "rotate-180" : ""} />
            </button>
        </div>
      </footer>
    </div>
  );
}
