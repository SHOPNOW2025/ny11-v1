import React from "react";
import { motion } from "motion/react";
import { 
  Apple, 
  Smartphone, 
  MessageCircle, 
  Phone, 
  Instagram, 
  Globe, 
  MapPin,
  ChevronLeft,
  Moon
} from "lucide-react";

export default function QrPage({ lang }: { lang: "ar" | "en" }) {
  const content = {
    location: "دابوق، دخلة المواصفات والمقاييس",
    iphone: {
      title: "حمّل التطبيق على iPhone",
      subtitle: "App Store",
      url: "https://apps.apple.com/jo/app/ny11/id6760627175"
    },
    android: {
      title: "حمّل التطبيق على Android",
      subtitle: "Google Play",
      url: "https://play.google.com/store/apps/details?id=com.ny11.ny11"
    },
    whatsapp: {
      title: "تواصل معنا على واتساب",
      subtitle: "0780001121",
      url: "https://wa.me/962780001121"
    },
    phone: {
      title: "تواصل معنا",
      subtitle: "0780001121",
      url: "tel:0780001121"
    },
    instagram: {
      title: "تابعنا على إنستغرام",
      subtitle: "ny11jo@",
      url: "https://www.instagram.com/ny11jo"
    },
    website: {
      title: "الموقع الإلكتروني",
      subtitle: "ny11.fit",
      url: "https://ny11.fit"
    },
    map: {
      title: "موقعنا على الخريطة",
      subtitle: "دابوق، دخلة المواصفات والمقاييس",
      url: "https://maps.app.goo.gl/X2yAo26Ar54qHnG77"
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1508] text-white flex flex-col items-center p-6 relative overflow-hidden font-sans select-none" dir="rtl">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-[#8bc63f1a] blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-[#8bc63f0d] blur-[80px] rounded-full" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        {/* Top bar */}
        <div className="w-full flex justify-between items-start mb-8">
          <button className="w-10 h-10 rounded-full glass border border-white/5 flex items-center justify-center text-[#8bc63f] hover:bg-white/5 transition-colors">
            <Moon size={20} fill="currentColor" />
          </button>
        </div>

        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-2">
            <div className="absolute inset-0 bg-[#8bc63f4d] blur-2xl rounded-full" />
            <h1 className="text-8xl font-black italic tracking-tighter text-[#8bc63f] relative z-10 leading-none">
              ny11
            </h1>
          </div>
          <div className="text-[10px] font-bold tracking-[0.4em] text-[#8bc63f] opacity-80 uppercase mt-2">
            NY11 . HEALTHY KITCHEN
          </div>
        </motion.div>

        {/* Location Label */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass border border-[#8bc63f33] px-6 py-2 rounded-full flex items-center gap-2 mb-12"
        >
          <span className="text-[11px] font-bold text-[#8bc63f]">{content.location}</span>
          <MapPin size={14} className="text-[#8bc63f]" />
        </motion.div>

        {/* Buttons List */}
        <div className="w-full space-y-4 mb-20 px-2 lg:px-4">
          <LinkButton 
            icon={<Apple size={24} className="text-white" />} 
            title={content.iphone.title} 
            subtitle={content.iphone.subtitle} 
            url={content.iphone.url}
            delay={0.2}
            iconBg="bg-black/80"
          />
          <LinkButton 
            icon={<Smartphone size={24} className="text-white" />} 
            title={content.android.title} 
            subtitle={content.android.subtitle} 
            url={content.android.url}
            delay={0.3}
            iconBg="bg-blue-500"
          />
          <LinkButton 
            icon={<MessageCircle size={24} className="text-white" />} 
            title={content.whatsapp.title} 
            subtitle={content.whatsapp.subtitle} 
            url={content.whatsapp.url}
            delay={0.4}
            iconBg="bg-green-500"
          />
          <LinkButton 
            icon={<Phone size={24} className="text-white" />} 
            title={content.phone.title} 
            subtitle={content.phone.subtitle} 
            url={content.phone.url}
            delay={0.5}
            iconBg="bg-[#8bc63f]"
          />
          <LinkButton 
            icon={<Instagram size={24} className="text-white" />} 
            title={content.instagram.title} 
            subtitle={content.instagram.subtitle} 
            url={content.instagram.url}
            delay={0.6}
            iconBg="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
          />
          <LinkButton 
            icon={<Globe size={24} className="text-white" />} 
            title={content.website.title} 
            subtitle={content.website.subtitle} 
            url={content.website.url}
            delay={0.7}
            iconBg="bg-orange-400"
          />
          <LinkButton 
            icon={<MapPin size={24} className="text-white" />} 
            title={content.map.title} 
            subtitle={content.map.subtitle} 
            url={content.map.url}
            delay={0.8}
            iconBg="bg-orange-600"
          />
        </div>
      </div>
    </div>
  );
}

function LinkButton({ icon, title, subtitle, url, delay, iconBg }: any) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className="group flex items-center justify-between glass border border-white/10 p-3 lg:p-4 rounded-[2rem] hover:bg-white/10 active:scale-[0.98] transition-all shadow-2xl backdrop-blur-md"
    >
      <div className="w-8 flex items-center justify-center">
        <ChevronLeft size={18} className="text-[#8bc63f] opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
      </div>

      <div className="flex-1 text-center px-2">
        <h3 className="text-sm lg:text-base font-black text-white leading-tight">{title}</h3>
        <p className="text-[10px] font-bold text-[#8bc63f] opacity-80 uppercase tracking-widest mt-0.5">{subtitle}</p>
      </div>

      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg ${iconBg} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
    </motion.a>
  );
}
