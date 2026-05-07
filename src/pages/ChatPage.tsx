import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove, deleteDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { ChatMessage, ChatRoom, UserProfile, Expert } from "../types";
import { formatPrice } from "../lib/currency";
import { getLocalizedString } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Send, ChevronRight, MoreVertical, Paperclip, Bot, User, Trophy, FlaskConical, DollarSign, CreditCard, Check, CheckCheck, Image as ImageIcon, Smile, Star, Search, X, Heart, Download, Video, History, Ban, Pin, PinOff, Film } from "lucide-react";
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
  const [showGifModal, setShowGifModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [gifSearch, setGifSearch] = useState("");
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [activeGifTab, setActiveGifTab] = useState<"search" | "favorites">("search");
  const [quoteValue, setQuoteValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quoteCurrency, setQuoteCurrency] = useState("JOD");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;
    let unsubExpert: (() => void) | undefined;

    const unsubRoom = onSnapshot(doc(db, "chats", id), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ChatRoom;
        setRoom({ id: snap.id, ...data });
        
        // Reset unread count for current user
        if (data.unreadCount?.[user.uid] && data.unreadCount[user.uid] > 0) {
            updateDoc(doc(db, "chats", id), {
                [`unreadCount.${user.uid}`]: 0
            });
        }

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
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      
      // Mark unread messages as read
      const batch = writeBatch(db);
      let needsUpdate = false;
      snap.docs.forEach(d => {
          const m = d.data() as ChatMessage;
          if (m.senderId !== user.uid && !m.read) {
              batch.update(d.ref, { read: true, readAt: Date.now() });
              needsUpdate = true;
          }
      });
      if (needsUpdate) batch.commit();

      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    });

    return () => {
      unsubRoom();
      unsubMsg();
      if (unsubExpert) unsubExpert();
    };
  }, [id, user.uid]);

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
    cancel: lang === "ar" ? "إلغاء" : "Cancel",
    gifSearchLabel: lang === "ar" ? "بحث عن GIF..." : "Search GIFs...",
    favorites: lang === "ar" ? "المفضلة" : "Favorites",
    search: lang === "ar" ? "بحث" : "Search",
    noGifs: lang === "ar" ? "لا توجد صور محرّكة محفوظة" : "No saved GIFs yet",
    saveToFav: lang === "ar" ? "حفظ للمفضلة" : "Save to Favorites",
    removeFromFav: lang === "ar" ? "إزالة من المفضلة" : "Remove from Favorites",
    clearChat: lang === "ar" ? "مسح الدردشة" : "Clear Chat",
    blockUser: lang === "ar" ? "حظر المستخدم" : "Block User",
    unblockUser: lang === "ar" ? "إلغاء الحظر" : "Unblock User",
    pinChat: lang === "ar" ? "تثبيت الدردشة" : "Pin Chat",
    unpinChat: lang === "ar" ? "إلغاء التثبيت" : "Unpin Chat",
    showMedia: lang === "ar" ? "الوسائط المرسلة" : "Media gallery",
    clearConfirm: lang === "ar" ? "هل أنت متأكد من مسح جميع الرسائل؟" : "Are you sure you want to clear all messages?",
    blockConfirm: lang === "ar" ? "هل تريد حظر هذا المستخدم؟" : "Do you want to block this user?",
    pinnedSuccess: lang === "ar" ? "تم التثبيت" : "Pinned successfully",
    unpinnedSuccess: lang === "ar" ? "تم إلغاء التثبيت" : "Unpinned successfully",
    blockedSuccess: lang === "ar" ? "تم الحظر" : "Blocked successfully",
    unblockedSuccess: lang === "ar" ? "تم إلغاء الحظر" : "Unblocked successfully"
  };

  const sendMessage = async (payload?: { type: "IMAGE" | "GIF" | "VIDEO"; url: string }) => {
    if (!payload && !text.trim()) return;
    if (!id || !room) return;

    if (room.blockedBy?.includes(user.uid) || room.blockedBy?.some(p => p !== user.uid)) {
        alert(lang === "ar" ? "لا يمكنك مراسلة هذا المستخدم" : "You cannot message this user");
        return;
    }
    
    const msgText = payload ? "" : text;
    if (!payload) setText("");

    const msgData: any = {
      senderId: user.uid,
      timestamp: Date.now(),
      type: payload ? payload.type : "TEXT",
      read: false
    };

    if (payload) {
      if (payload.type === "IMAGE") msgData.imageUrl = payload.url;
      if (payload.type === "GIF") msgData.gifUrl = payload.url;
      if (payload.type === "VIDEO") msgData.videoUrl = payload.url;
    } else {
      msgData.text = msgText;
    }

    const recipientId = room.participants.find(p => p !== user.uid);

    await addDoc(collection(db, "chats", id, "messages"), msgData);
    
    const roomUpdate: any = {
        lastMessage: payload ? (payload.type === "IMAGE" ? "📷 صورة" : payload.type === "VIDEO" ? "🎥 فيديو" : "🎬 GIF") : msgText,
        updatedAt: Date.now()
    };

    if (recipientId) {
        roomUpdate[`unreadCount.${recipientId}`] = (room.unreadCount?.[recipientId] || 0) + 1;
    }

    await updateDoc(doc(db, "chats", id), roomUpdate);

    if (room.type === "AI" && !payload) {
        setIsAiLoading(true);
        const history = messages.map(m => ({
            role: m.senderId === user.uid ? "user" : "model",
            parts: [{ text: m.text || "" }]
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();

    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        sendMessage({ type: isVideo ? "VIDEO" : "IMAGE", url: base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const searchGifs = async () => {
    if (!gifSearch.trim()) return;
    setGifLoading(true);
    try {
        const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(gifSearch)}&limit=12`);
        const data = await res.json();
        setGifResults(data.data.map((g: any) => g.images.fixed_height.url));
    } catch (err) {
        console.error(err);
    } finally {
        setGifLoading(false);
    }
  };

  const toggleFavoriteGif = async (url: string) => {
    const isFav = user.savedGifs?.includes(url);
    const userRef = doc(db, "users", user.uid);
    try {
        await updateDoc(userRef, {
            savedGifs: isFav ? arrayRemove(url) : arrayUnion(url)
        });
    } catch (err) {
        console.error(err);
    }
  };

  const clearChat = async () => {
    if (!id || !confirm(t.clearConfirm)) return;
    try {
      setLoading(true);
      const q = query(collection(db, "chats", id, "messages"));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await updateDoc(doc(db, "chats", id), { lastMessage: "", updatedAt: Date.now() });
      setShowOptionsMenu(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async () => {
    if (!id) return;
    const isPinned = room?.pinnedBy?.includes(user.uid);
    try {
      await updateDoc(doc(db, "chats", id), {
        pinnedBy: isPinned ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      setShowOptionsMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBlock = async () => {
    if (!id || !room) return;
    const isBlocked = room.blockedBy?.includes(user.uid);
    if (!isBlocked && !confirm(t.blockConfirm)) return;
    
    try {
      await updateDoc(doc(db, "chats", id), {
        blockedBy: isBlocked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      setShowOptionsMenu(false);
    } catch (err) {
      console.error(err);
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
      <header className="p-4 flex items-center justify-between border-b border-white/5 glass sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center">
            {lang === 'ar' ? <ChevronRight size={20} /> : <ChevronRight size={20} className="rotate-180" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3 rtl:space-x-reverse">
              <div 
                className="w-10 h-10 rounded-xl overflow-hidden glass p-0.5 relative z-20 border-2 border-[#0a0c10] cursor-pointer hover:scale-110 transition-transform active:scale-95"
                onClick={() => {
                  const expertId = room.type === "EXPERT" ? room.expertId : room.participants.find(p => p !== user.uid);
                  if (expertId) navigate(`/profile/${expertId}`);
                }}
              >
                {room.type === "AI" ? (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-background-dark">
                    <Bot size={20} />
                  </div>
                ) : (
                  <img src={expert?.image || "https://ui-avatars.com/api/?name=E"} className="w-full h-full object-cover rounded-[10px]" alt="" />
                )}
                {expert?.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-background-dark rounded-full"></div>}
              </div>
              <div 
                className="w-10 h-10 rounded-xl overflow-hidden glass p-0.5 relative z-10 border-2 border-[#0a0c10] cursor-pointer hover:scale-110 transition-transform active:scale-95"
                onClick={() => navigate(`/profile/${user.uid}`)}
              >
                <img src={user.profilePic || user.image || "https://ui-avatars.com/api/?name=U"} className="w-full h-full object-cover rounded-[10px]" alt="" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold">{room.type === "AI" ? t.aiAssistant : getLocalizedString(expert?.name, lang)}</h1>
              <p className="text-[10px] text-primary">{room.type === "AI" ? t.alwaysOnline : (expert?.role === "TRAINER" ? t.trainer : t.labManager)}</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          
          <AnimatePresence>
            {showOptionsMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={`absolute top-full mt-2 ${lang === 'ar' ? 'left-0' : 'right-0'} w-48 glass bg-background-dark border border-white/10 rounded-2xl py-2 shadow-2xl z-[110]`}
              >
                <button onClick={togglePin} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-xs font-bold text-white/70">
                  <span className="flex items-center gap-2">
                    {room.pinnedBy?.includes(user.uid) ? <PinOff size={14} /> : <Pin size={14} />}
                    {room.pinnedBy?.includes(user.uid) ? t.unpinChat : t.pinChat}
                  </span>
                </button>
                <button onClick={() => { setShowMediaModal(true); setShowOptionsMenu(false); }} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-xs font-bold text-white/70">
                  <span className="flex items-center gap-2">
                    <Film size={14} />
                    {t.showMedia}
                  </span>
                </button>
                <button onClick={clearChat} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-xs font-bold text-white/70">
                  <span className="flex items-center gap-2">
                    <History size={14} />
                    {t.clearChat}
                  </span>
                </button>
                <div className="mx-2 my-1 border-t border-white/5"></div>
                <button onClick={toggleBlock} className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-500/10 transition-colors text-xs font-bold text-red-500">
                  <span className="flex items-center gap-2">
                    <Ban size={14} />
                    {room.blockedBy?.includes(user.uid) ? t.unblockUser : t.blockUser}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
                ) : m.type === "IMAGE" ? (
                    <img src={m.imageUrl} className="max-w-full rounded-lg cursor-pointer" alt="" onClick={() => { setShowMediaModal(true); }} />
                ) : m.type === "VIDEO" ? (
                    <video src={m.videoUrl} className="max-w-full rounded-lg" controls />
                ) : m.type === "GIF" ? (
                    <div className="relative group">
                        <img src={m.gifUrl} className="max-w-full rounded-lg" alt="" />
                        <button 
                            onClick={() => toggleFavoriteGif(m.gifUrl!)}
                            className="absolute top-2 right-2 p-1.5 glass rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Heart size={14} className={user.savedGifs?.includes(m.gifUrl!) ? "fill-red-500 text-red-500" : "text-white"} />
                        </button>
                    </div>
                ) : m.text}
                <div className="flex items-center justify-end gap-1 mt-1">
                    <p className={`text-[8px] opacity-40 ${m.senderId === user.uid ? "text-black" : "text-white"}`}>
                        {new Date(m.timestamp).toLocaleTimeString(lang === 'ar' ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {m.senderId === user.uid && (
                        <div className="flex items-center">
                            {m.read ? (
                                <CheckCheck size={10} className="text-blue-500" />
                            ) : (
                                <Check size={10} className="text-black/30" />
                            )}
                        </div>
                    )}
                </div>
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

        {showGifModal && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ y: 100 }} 
                    animate={{ y: 0 }} 
                    exit={{ y: 100 }}
                    className="w-full max-w-lg glass bg-background-dark rounded-[3rem] p-6 space-y-6 border border-white/10 h-[80vh] flex flex-col"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                            <button 
                            onClick={() => setActiveGifTab("search")}
                            className={`text-sm font-black uppercase tracking-widest ${activeGifTab === "search" ? "text-primary" : "text-white/40"}`}
                            >
                                {t.search}
                            </button>
                            <button 
                            onClick={() => setActiveGifTab("favorites")}
                            className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${activeGifTab === "favorites" ? "text-primary" : "text-white/40"}`}
                            >
                                {t.favorites} <Star size={14} className={activeGifTab === "favorites" ? "fill-primary" : ""} />
                            </button>
                        </div>
                        <button onClick={() => setShowGifModal(false)} className="w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    {activeGifTab === "search" ? (
                        <div className="flex gap-2 bg-white/5 rounded-2xl p-2 border border-white/10">
                            <input 
                            type="text" 
                            className="bg-transparent border-none focus:ring-0 flex-1 text-sm py-2 px-2"
                            placeholder={t.gifSearchLabel}
                            value={gifSearch}
                            onChange={(e) => setGifSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchGifs()}
                            />
                            <button onClick={searchGifs} className="p-2 text-primary hover:scale-110 transition-transform">
                                <Search size={20} />
                            </button>
                        </div>
                    ) : null}

                    <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar">
                        <div className="grid grid-cols-2 gap-3 pb-8">
                            {activeGifTab === "search" ? (
                                gifLoading ? (
                                    <div className="col-span-2 py-20 text-center opacity-30 text-xs uppercase font-black tracking-widest">{t.loading}</div>
                                ) : (
                                    gifResults.map((url, i) => (
                                        <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden glass border border-white/5">
                                            <img 
                                                src={url} 
                                                className="w-full h-full object-cover cursor-pointer" 
                                                onClick={() => {
                                                    sendMessage({ type: "GIF", url });
                                                    setShowGifModal(false);
                                                }}
                                                alt=""
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavoriteGif(url);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 glass rounded-full transition-all active:scale-90"
                                            >
                                                <Heart size={14} className={user.savedGifs?.includes(url) ? "fill-red-500 text-red-500" : "text-white/60"} />
                                            </button>
                                        </div>
                                    ))
                                )
                            ) : (
                                (user.savedGifs || []).length > 0 ? (
                                    user.savedGifs?.map((url, i) => (
                                        <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden glass border border-white/5">
                                            <img 
                                                src={url} 
                                                className="w-full h-full object-cover cursor-pointer" 
                                                onClick={() => {
                                                    sendMessage({ type: "GIF", url });
                                                    setShowGifModal(false);
                                                }}
                                                alt=""
                                            />
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleFavoriteGif(url);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 glass rounded-full transition-all active:scale-90"
                                            >
                                                <X size={14} className="text-white/60 hover:text-red-500" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-20 text-center opacity-30 text-xs uppercase font-black tracking-widest">{t.noGifs}</div>
                                )
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {showMediaModal && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            >
                <div className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-t-[2.5rem]">
                        <h3 className="text-lg font-black uppercase tracking-widest text-primary">{t.showMedia}</h3>
                        <button onClick={() => setShowMediaModal(false)} className="w-10 h-10 glass rounded-full flex items-center justify-center text-white/40 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 bg-white/5 p-6 overflow-y-auto rounded-b-[2.5rem] no-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
                            {messages.filter(m => m.type === "IMAGE" || m.type === "VIDEO" || m.type === "GIF").reverse().map((m) => (
                                <div key={m.id} className="aspect-square glass rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all group">
                                    {m.type === "IMAGE" || m.type === "GIF" ? (
                                        <img src={m.imageUrl || m.gifUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    ) : (
                                        <div className="w-full h-full relative">
                                            <video src={m.videoUrl} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-colors">
                                                <Film size={24} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {messages.filter(m => m.type === "IMAGE" || m.type === "VIDEO" || m.type === "GIF").length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-20 uppercase font-black text-xs tracking-[0.3em]">{lang === "ar" ? "لا توجد وسائط" : "No media found"}</div>
                            )}
                        </div>
                    </div>
                </div>
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
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    accept="image/*,video/*" 
                    onChange={handleFileUpload} 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/20 hover:text-primary transition-colors px-1"
                >
                    <ImageIcon size={18} />
                </button>
                <button 
                    onClick={() => setShowGifModal(true)}
                    className="text-white/20 hover:text-primary transition-colors px-1"
                >
                    <Smile size={18} />
                </button>
                <input 
                    type="text" 
                    placeholder={t.typeMessage}
                    className="bg-transparent border-none focus:ring-0 text-sm flex-1 py-4 px-2"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
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
