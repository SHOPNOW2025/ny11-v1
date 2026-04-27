import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Expert, UserProfile, ChatRoom } from "../types";
import { formatPrice } from "../lib/currency";
import { getLocalizedString } from "../lib/utils";
import { motion } from "motion/react";
import { Star, MessageCircle, Info, Activity, ShieldCheck, Trophy, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClinicPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["TRAINER", "LAB_MANAGER"]));
    const unsub = onSnapshot(q, (snap) => {
      setExperts(snap.docs.map(d => {
          const data = d.data();
          return { 
            id: d.id, 
            ...data,
            image: data.profilePic || data.image || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
            role: data.role === "TRAINER" ? "TRAINER" : "LAB_MANAGER",
            rating: data.rating || 5.0,
            price: data.price || 0,
            currency: data.serviceCurrency || data.currency || "JOD",
            bio: typeof data.bio === 'object' ? data.bio : { ar: data.bio || "خبير متخصص في الرعاية الصحية", en: data.bio || "Healthcare Specialist" },
            online: data.online || false,
            name: typeof data.name === 'object' ? data.name : { ar: data.name || "خبير", en: data.name || "Expert" }
          } as Expert;
      }));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startChat = async (expertId: string, type: "EXPERT" | "AI") => {
    // Check for existing chat
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("participants", "array-contains", user.uid),
      where("type", "==", type)
    );
    const snap = await getDocs(q);
    
    let chatRoom = snap.docs.find(d => {
        const data = d.data() as ChatRoom;
        return type === "AI" ? true : data.expertId === expertId;
    });

    if (!chatRoom) {
      const newRoom = await addDoc(collection(db, "chats"), {
        participants: [user.uid, expertId].filter(id => id !== "AI"),
        expertId: expertId === "AI" ? null : expertId,
        type: type,
        updatedAt: Date.now(),
        lastMessage: lang === "ar" ? "بدأت الدردشة الآن" : "Chat started now"
      });
      navigate(`/chat/${newRoom.id}`);
    } else {
      navigate(`/chat/${chatRoom.id}`);
    }
  };

  const t = {
    trainers: lang === "ar" ? "المدربون" : "Trainers",
    experts: lang === "ar" ? "& الخبراء" : "& Experts",
    intro: lang === "ar" ? "تحدث مع نخبة من المدربين ومدراء المختبرات للحصول على خطة مخصصة تعزز أدائك." : "Talk to elite trainers and lab managers for a personalized plan to boost your performance.",
    aiTitle: lang === "ar" ? "المساعد الصحي الذكي" : "Smart Health Assistant",
    aiSub: lang === "ar" ? "بواسطة الذكاء الاصطناعي - متوفر 24/7" : "AI Powered - Available 24/7",
    chat: lang === "ar" ? "دردشة" : "Chat",
    availableStaff: lang === "ar" ? "الطاقم المتاح" : "Available Staff",
    consultationVal: lang === "ar" ? "قيمة الاستشارة" : "Consultation Value",
    onlineNow: lang === "ar" ? "متاح الآن" : "Available Now"
  };

  return (
    <div className="flex flex-col flex-1 pb-32">
      <header className="p-6 pt-12 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-[1px] bg-primary" />
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">ELITE DISCOVERY</h2>
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase whitespace-pre-line text-[var(--text-main)]">
          {t.trainers}<br/>
          <span className="text-primary not-italic">{t.experts}</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-medium max-w-[280px] leading-relaxed">
          {t.intro}
        </p>
      </header>

      <main className="p-6 space-y-8">
        {/* AI Banner */}
        <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => startChat("AI", "AI")}
            className="primary-gradient rounded-3xl p-6 flex items-center justify-between overflow-hidden relative group cursor-pointer shadow-xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <Brain size={120} />
          </div>
          <div className="relative z-10 space-y-1">
            <h3 className="text-xl font-black text-background-dark">{t.aiTitle}</h3>
            <p className="text-[10px] text-background-dark/60 font-bold">{t.aiSub}</p>
          </div>
          <div className="bg-background-dark text-primary px-4 py-2 rounded-xl text-[10px] font-bold">{t.chat}</div>
        </motion.div>

        {/* Categories (Simplified filters) */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full text-[10px] font-bold text-primary border-primary/20 whitespace-nowrap">
                <Trophy size={14} /> {lang === "ar" ? "مدربون رياضيون" : "Trainers"}
            </div>
            <div className="flex items-center gap-2 glass px-4 py-2 rounded-full text-[10px] font-bold text-white/40 whitespace-nowrap">
                <ShieldCheck size={14} /> {lang === "ar" ? "مدراء مختبرات" : "Lab Managers"}
            </div>
        </div>

        {/* Experts List */}
        <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-main)] italic underline decoration-primary/30 decoration-4">{t.availableStaff}</h2>
                <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-md">{experts.length} {t.onlineNow}</span>
            </div>
            
            {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-32 glass rounded-[2.5rem] animate-pulse" />)
            ) : (
                <div className="space-y-4">
                    {experts.map((expert, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                            key={expert.id}
                            className="glass rounded-[2.5rem] p-5 flex gap-5 items-center group border border-[var(--border-muted)] hover:border-primary/20 transition-all duration-500"
                        >
                            <div className="w-24 h-28 rounded-3xl overflow-hidden shrink-0 relative bg-white/5">
                                <img src={expert.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={getLocalizedString(expert.name, lang)} />
                                {expert.online && (
                                    <div className="absolute top-3 right-3 w-3 h-3 bg-primary rounded-full border-2 border-background-dark shadow-[0_0_10px_rgba(139,198,63,0.5)]"></div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                        {expert.role === "TRAINER" ? "ELITE TRAINER" : "LAB DIRECTOR"}
                                    </span>
                                    <div className="flex items-center gap-1 text-amber-400">
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-[10px] font-black">{expert.rating}</span>
                                    </div>
                                </div>
                                
                                <h3 className="font-black text-lg tracking-tight text-[var(--text-main)] uppercase truncate">
                                    {getLocalizedString(expert.name, lang)}
                                </h3>
                                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed line-clamp-2 italic font-medium">
                                    "{getLocalizedString(expert.bio, lang)}"
                                </p>
                                
                                <div className="flex items-center justify-between pt-3">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t.consultationVal}</p>
                                        <p className="text-sm font-black text-primary tracking-tighter">{formatPrice(expert.price, user, expert.currency)}</p>
                                    </div>
                                    <button 
                                        onClick={() => startChat(expert.id, "EXPERT")}
                                        className="w-12 h-12 primary-gradient text-background-dark rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <MessageCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
      </main>
    </div>
  );
}
