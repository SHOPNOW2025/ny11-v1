import { Languages } from "lucide-react";
import { motion } from "motion/react";

export default function LanguageToggle({ lang, toggle }: { lang: "ar" | "en"; toggle: () => void }) {
  return (
    <motion.button 
      drag
      dragElastic={0.1}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className={`fixed right-6 top-6 w-10 h-10 rounded-xl flex items-center justify-center transition-all z-[110] shadow-xl glass border border-white/10 text-primary cursor-grab active:cursor-grabbing`}
    >
      <div className="flex flex-col items-center">
        <Languages size={16} />
        <span className="text-[7px] font-black uppercase mt-0.5">{lang === "ar" ? "EN" : "AR"}</span>
      </div>
    </motion.button>
  );
}
