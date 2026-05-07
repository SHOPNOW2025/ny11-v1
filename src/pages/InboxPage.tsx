import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, ChatRoom } from "../types";
import { getLocalizedString } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, ChevronLeft, Bot, Search, Brain, FlaskConical, User, Trash2, Plus, Pin } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ChatItem({ chat, user, lang, t, navigate }: any) {
    const [otherParty, setOtherParty] = useState<any>(null);

    useEffect(() => {
        if (chat.type === "AI") {
            setOtherParty({
                name: t.aiAssistant,
                img: null,
                role: "AI Assistant"
            });
            return;
        }

        const otherPartyId = chat.participants.find((p: string) => p !== user.uid) || chat.expertId;
        if (otherPartyId && otherPartyId !== user.uid) {
            const unsub = onSnapshot(doc(db, "users", otherPartyId), (snap) => {
                if (snap.exists()) {
                    const pData = snap.data();
                    setOtherParty({
                        name: getLocalizedString(pData.name, lang),
                        img: pData.profilePic || pData.image,
                        role: pData.role === "TRAINER" ? t.trainer : pData.role === "LAB_MANAGER" ? t.labManager : t.member
                    });
                }
            });
            return () => unsub();
        }
    }, [chat.id, chat.type, chat.participants, chat.expertId, user.uid, lang]);

    if (!otherParty) return <div className="h-24 glass rounded-[2rem] animate-pulse" />;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate(`/chat/${chat.id}`)}
            className={`glass rounded-[2rem] p-5 flex items-center gap-5 border active:scale-95 transition-all cursor-pointer group ${
                chat.unreadCount?.[user.uid] > 0 ? "border-primary/40 bg-primary/[0.03] shadow-[0_0_20px_rgba(139,198,63,0.05)]" : "border-white/5"
            }`}
        >
            <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl glass p-0.5 overflow-hidden relative">
                    {chat.type === "AI" ? (
                        <div className="w-full h-full primary-gradient flex items-center justify-center text-background-dark">
                            <Brain size={32} />
                        </div>
                    ) : (
                        <img 
                            src={otherParty.img || `https://ui-avatars.com/api/?name=${otherParty.name}&background=8bc63f&color=000`} 
                            className="w-full h-full object-cover rounded-[14px]" 
                            alt="" 
                        />
                    )}
                    {chat.pinnedBy?.includes(user.uid) && (
                        <div className="absolute top-1 right-1 bg-primary text-black p-1 rounded-md shadow-lg">
                            <Pin size={10} className="fill-black" />
                        </div>
                    )}
                </div>
                {chat.type !== "AI" && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-4 border-background-dark rounded-full"></div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm tracking-tight text-[var(--text-main)] uppercase truncate pr-2 ${
                         chat.unreadCount?.[user.uid] > 0 ? "font-black" : "font-bold opacity-80"
                    }`}>
                        {otherParty.name}
                    </h3>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 leading-none">{otherParty.role}</p>
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <p className={`text-xs font-medium truncate italic ${
                        chat.unreadCount?.[user.uid] > 0 ? "text-white opacity-100 font-bold" : "text-[var(--text-muted)] opacity-60"
                    }`}>
                        {chat.lastMessage || t.startChatMsg}
                    </p>
                    {chat.unreadCount?.[user.uid] > 0 && (
                        <div className="bg-primary text-black text-[9px] font-black w-5 h-5 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            {chat.unreadCount[user.uid]}
                        </div>
                    )}
                </div>
            </div>

            <ChevronLeft size={16} className={`text-white/10 group-hover:text-primary transition-colors transform ${lang === 'ar' ? 'translate-x-2' : '-translate-x-2'}`} />
        </motion.div>
    );
}

export default function InboxPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const t = {
    startChatMsg: lang === "ar" ? "بدأت الدردشة الآن" : "Chat started now",
    aiAssistant: lang === "ar" ? "المساعد الذكي" : "AI Assistant",
    trainer: lang === "ar" ? "مدرب لياقة" : "Fitness Trainer",
    labManager: lang === "ar" ? "مدير مختبر" : "Lab Manager",
    member: lang === "ar" ? "عضو" : "Member",
    inbox: lang === "ar" ? "بريد" : "Message",
    messages: lang === "ar" ? "الرسائل" : "Inbox",
    searchPlaceholder: lang === "ar" ? "ابحث في المحادثات..." : "Search conversations...",
    noMessages: lang === "ar" ? "لا توجد رسائل حالياً" : "No messages currently"
  };

  useEffect(() => {
    let q;
    
    if (user.role === "TRAINER" || user.role === "LAB_MANAGER") {
        q = query(
            collection(db, "chats"),
            where("expertId", "==", user.uid)
        );
    } else {
        q = query(
            collection(db, "chats"),
            where("participants", "array-contains", user.uid)
        );
    }

    const unsub = onSnapshot(q, (snap) => {
      const chatList = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
      }));
      
      chatList.sort((a: any, b: any) => {
        const aPinned = a.pinnedBy?.includes(user.uid) ? 1 : 0;
        const bPinned = b.pinnedBy?.includes(user.uid) ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
      setChats(chatList);
      setLoading(false);
    }, (err) => {
        console.error("Error fetching chats:", err);
        setLoading(false);
    });

    return () => unsub();
  }, [user.uid, user.role, lang]);

  const filteredChats = chats.filter(c => 
    c.lastMessage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 pb-32 overflow-x-hidden">
      <header className="p-6 pt-12 space-y-6">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">COMMS CENTER</h2>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">
                    {t.inbox}<br/>
                    <span className="text-primary not-italic">{t.messages}</span>
                </h1>
            </div>
            <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-primary shadow-xl">
                <MessageSquare size={28} />
            </div>
        </div>

        <div className="glass rounded-2xl px-5 py-4 flex items-center gap-4 border-white/5">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                className="bg-transparent border-none focus:ring-0 text-sm w-full font-bold placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </header>

      <main className="px-6 space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 glass rounded-[2rem] animate-pulse" />)
        ) : filteredChats.length > 0 ? (
          <AnimatePresence>
            {filteredChats.map((chat, idx) => (
              <ChatItem 
                key={chat.id} 
                chat={chat} 
                user={user} 
                lang={lang} 
                t={t} 
                navigate={navigate} 
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-5" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{t.noMessages}</p>
          </div>
        )}
      </main>
    </div>
  );
}
