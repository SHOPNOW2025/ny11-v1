import React, { useState } from "react";
import { UserProfile } from "../types";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { motion } from "motion/react";
import { ChevronLeft, User, Phone, Mail, Award, Target, Bell, Eye, Shield, Save, Check, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getLocalizedString } from "../lib/utils";

export default function SettingsPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
    const navigate = useNavigate();
    const [name, setName] = useState(getLocalizedString(user.name, lang));
    const [email, setEmail] = useState(user.email);
    const [image, setImage] = useState(user.profilePic || user.image || "");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

  const t = {
    settingsTitle: lang === "ar" ? "الإعدادات الشخصية" : "Personal Settings",
    settingsSub: lang === "ar" ? "تعديل الملف الشخصي" : "Edit Profile",
    personalInfo: lang === "ar" ? "المعلومات الشخصية" : "Personal Info",
    fullName: lang === "ar" ? "الاسم الكامل" : "Full Name",
    profilePic: lang === "ar" ? "رابط الصورة الشخصية" : "Profile Picture URL",
    emailPlaceholder: lang === "ar" ? "البريد الإلكتروني" : "Email Address",
    preferences: lang === "ar" ? "التفضيلات" : "Preferences",
    mealAlerts: lang === "ar" ? "تنبيهات الوجبات" : "Meal Alerts",
    mealDesc: lang === "ar" ? "تذكير بمواعيد الوجبات المقترحة" : "Reminders for suggested meal times",
    achievementAlerts: lang === "ar" ? "تنبيهات الإنجاز" : "Achievement Alerts",
    achievementDesc: lang === "ar" ? "الحصول على إشعارات عند تحقيق أهدافك" : "Get notifications when you reach goals",
    darkMode: lang === "ar" ? "الوضع الليلي" : "Dark Mode",
    darkModeDesc: lang === "ar" ? "تبديل مظهر التطبيق" : "Toggle app appearance",
    saveSuccess: lang === "ar" ? "تم الحفظ بنجاح" : "Saved Successfully",
    saveChanges: lang === "ar" ? "حفظ التغييرات" : "Save Changes",
    errorSaving: lang === "ar" ? "حدث خطأ أثناء الحفظ" : "Error while saving"
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        email,
        profilePic: image,
        image: image // update both for consistency as some pages use p.image and others p.profilePic
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(t.errorSaving);
    }
    setSaving(false);
  };

  return (
    <div className="flex-1 flex flex-col pt-12 pb-32 overflow-x-hidden">
      <div className="px-6 flex items-center justify-between mb-10">
        <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-[var(--text-muted)] border-[var(--border-muted)]">
          <ChevronLeft size={20} className={lang === 'en' ? 'rotate-180' : ''} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">{t.settingsTitle}</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.settingsSub}</p>
        </div>
        <div className="w-12" />
      </div>

      <main className="px-6 space-y-10">
        {/* Profile Form */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase px-2">{t.personalInfo}</h2>
          <div className="glass rounded-[2.5rem] p-8 border-[var(--border-muted)] space-y-6">
            <div className="flex justify-center mb-4">
                <div className="relative group cursor-pointer" onClick={() => {
                    const url = prompt(lang === "ar" ? "أدخل رابط الصورة الجديد:" : "Enter new image URL:");
                    if (url) setImage(url);
                }}>
                    <div className="w-24 h-24 rounded-3xl overflow-hidden glass p-1 border-white/5">
                        <img 
                            src={image || `https://ui-avatars.com/api/?name=${name}&background=8bc63f&color=000`} 
                            className="w-full h-full object-cover rounded-2xl" 
                            alt="" 
                        />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <User size={24} className="text-primary" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-primary text-background-dark rounded-xl flex items-center justify-center shadow-lg">
                        <Plus size={16} />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">{t.fullName}</p>
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-4 border border-white/5 focus-within:border-primary/50 transition-all">
                <User size={18} className="text-white/20" />
                <input 
                  type="text" 
                  className="bg-transparent border-none focus:ring-0 w-full font-bold text-sm" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">{t.profilePic}</p>
                <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-4 border border-white/5 focus-within:border-primary/50 transition-all">
                    <Eye size={18} className="text-white/20" />
                    <input 
                        type="text" 
                        className="bg-transparent border-none focus:ring-0 w-full font-bold text-sm" 
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                    />
                </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">{t.emailPlaceholder}</p>
              <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-5 py-4 border border-white/5 focus-within:border-primary/50 transition-all opacity-50">
                <Mail size={18} className="text-white/20" />
                <input 
                  type="email" 
                  disabled
                  className="bg-transparent border-none focus:ring-0 w-full font-bold text-sm" 
                  value={email}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-6">
          <h2 className="text-[10px] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase px-2">{t.preferences}</h2>
          <div className="space-y-3">
            <SettingsToggle icon={<Bell size={18} />} title={t.mealAlerts} desc={t.mealDesc} active={true} lang={lang} />
            <SettingsToggle icon={<Award size={18} />} title={t.achievementAlerts} desc={t.achievementDesc} active={true} lang={lang} />
            <SettingsToggle icon={<Eye size={18} />} title={t.darkMode} desc={t.darkModeDesc} active={true} lang={lang} />
          </div>
        </section>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-5 rounded-[2rem] font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
              saved ? "bg-emerald-500 text-white" : "primary-gradient text-background-dark shadow-xl shadow-primary/20"
            }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check size={18} />
                {t.saveSuccess}
              </>
            ) : (
              <>
                <Save size={18} />
                {t.saveChanges}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

function SettingsToggle({ icon, title, desc, active, lang }: any) {
  return (
    <div className="glass rounded-[2rem] p-6 border-[var(--border-muted)] flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold truncate">{title}</h4>
          <p className="text-[10px] text-[var(--text-muted)] truncate">{desc}</p>
        </div>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${active ? "bg-primary/20" : "bg-white/10"}`}>
        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${lang === 'ar' ? (active ? "right-1 bg-primary" : "right-7 bg-white/20") : (active ? "right-7 bg-primary" : "right-1 bg-white/20")}`} />
      </div>
    </div>
  );
}
