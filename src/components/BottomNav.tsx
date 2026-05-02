import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NavLink } from "react-router-dom";
import { Home, Utensils, FlaskConical, MessageSquare, User, ShieldCheck, Sparkles, ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { UserRole } from "../types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function BottomNav({ user, role, lang }: { user: any, role: UserRole, lang: "ar" | "en" }) {
  const [isVisible, setIsVisible] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user) {
        setUnreadTotal(0);
        return;
    }

    const q = query(collection(db, "chats"), where("participants", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
        let total = 0;
        snap.docs.forEach(doc => {
            const data = doc.data();
            total += (data.unreadCount?.[user.uid] || 0);
        });
        setUnreadTotal(total);
    });

    return () => unsub();
  }, [user]);

  const t = {
    home: lang === "ar" ? "الرئيسية" : "Home",
    menu: lang === "ar" ? "المنيو" : "Menu",
    clinic: lang === "ar" ? "المدربون" : "Clinic",
    lab: lang === "ar" ? "المختبر" : "Lab",
    inbox: lang === "ar" ? "الرسائل" : "Inbox",
    admin: lang === "ar" ? "الإدارة" : "Admin",
    profile: lang === "ar" ? "حسابي" : "Profile"
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 max-w-md mx-auto flex flex-col items-center">
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shadow-lg active:scale-90"
      >
        {isVisible ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      <AnimatePresence>
        {isVisible && (
          <motion.nav 
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full bg-black/60 backdrop-blur-3xl rounded-[2rem] p-2 flex justify-around items-center shadow-2xl border border-white/[0.08]"
          >
            <NavItem to="/" icon={<Home size={18} />} label={t.home} />
            <NavItem to="/menu" icon={<Utensils size={18} />} label={t.menu} />
            <NavItem to="/clinic" icon={<Sparkles size={18} />} label={t.clinic} />
            <NavItem to="/lab" icon={<FlaskConical size={18} />} label={t.lab} />
            <NavItem to="/inbox" icon={<MessageSquare size={18} />} label={t.inbox} badge={unreadTotal} />
            
            {role === "ADMIN" && (
              <NavItem to="/admin" icon={<ShieldCheck size={18} />} label={t.admin} />
            )}

            {role === "ACCOUNTANT" && (
              <NavItem to="/accountant" icon={<Wallet size={18} />} label={lang === "ar" ? "المحاسبة" : "Accounting"} />
            )}
            
            <NavItem to="/profile" icon={<User size={18} />} label={t.profile} />
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ to, icon, label, badge }: { to: string; icon: React.ReactNode; label: string, badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 min-w-[50px] ${
          isActive ? "text-primary" : "text-white/40 hover:text-white/80"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`transition-transform duration-300 ${isActive ? "scale-110 -translate-y-1" : "scale-100"} relative`}>
            {icon}
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                    {badge > 9 ? '+9' : badge}
                </span>
            )}
          </div>
          <span className={`text-[7px] font-black mt-1 tracking-tighter transition-all duration-300 ${isActive ? "opacity-100 translate-y-0" : "opacity-60 translate-y-1"} uppercase`}>{label}</span>
          {isActive && (
            <motion.div 
              layoutId="nav-glow"
              className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_#8bc63f]"
            />
          )}
        </>
      )}
    </NavLink>
  );
}
