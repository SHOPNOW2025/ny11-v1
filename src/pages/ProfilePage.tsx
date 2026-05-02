import React, { useState } from "react";
import { UserProfile } from "../types";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import { doc, updateDoc, addDoc, collection, increment } from "firebase/firestore";
import { 
    Wallet, 
    Settings, 
    LogOut, 
    ShieldCheck, 
    Trophy, 
    FlaskConical, 
    ChevronLeft,
    Clock,
    CreditCard,
    DollarSign,
    Coins,
    Camera,
    Loader2,
    Info
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/currency";
import { uploadImage } from "../services/imageService";

import { getLocalizedString } from "../lib/utils";

export default function ProfilePage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const toggleCurrency = async () => {
    const newCurrency = user.currency === "USD" ? "JOD" : "USD";
    await updateDoc(doc(db, "users", user.uid), { currency: newCurrency });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      await updateDoc(doc(db, "users", user.uid), { profilePic: url });
    } catch (err) {
      alert("فشل رفع الصورة");
    }
    setIsUploading(false);
  };

  return (
    <div className="flex flex-col flex-1 pb-32">
      <header className="p-8 pt-12 flex flex-col items-center gap-4 bg-gradient-to-b from-primary/5 to-transparent">
        <label className="relative cursor-pointer group">
          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
          <div className="w-24 h-24 rounded-3xl border-4 border-primary p-1 bg-background-dark overflow-hidden rotate-3 transition-transform group-hover:rotate-0">
            {isUploading ? (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <img 
                src={user.profilePic || `https://ui-avatars.com/api/?name=${user.name}&background=8bc63f&color=000`} 
                className="w-full h-full object-cover rounded-2xl -rotate-3 group-hover:rotate-0 transition-transform" 
                alt={user.name} 
              />
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={20} className="text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-black rounded-lg p-1 font-black text-[8px] uppercase tracking-tighter shadow-lg z-10">
            {user.role}
          </div>
        </label>
        <div className="text-center">
          <h1 className="text-2xl font-black italic tracking-tighter">{getLocalizedString(user.name, lang)}</h1>
          <p className="text-white/40 text-xs mt-1 lowercase">{user.email}</p>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Wallet Card */}
        <section className="primary-gradient p-5 rounded-3xl flex items-center justify-between shadow-xl shadow-primary/20">
          <div className="space-y-1">
            <p className="text-background-dark/60 text-[10px] font-bold uppercase tracking-widest">رصيد المحفظة</p>
            <p className="text-3xl font-black text-background-dark">{formatPrice(user.walletBalance, user)}</p>
          </div>
          <div className="w-12 h-12 bg-background-dark/10 rounded-2xl flex items-center justify-center text-background-dark">
            <Wallet size={24} />
          </div>
        </section>

        {/* Currency Switcher */}
        <section className="glass rounded-3xl p-4 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Coins size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold">العملة المفضلة</h4>
                    <p className="text-[10px] text-white/30">الحالية: {user.currency === "USD" ? "الدولار الأمريكي" : "الدينار الأردني"}</p>
                </div>
            </div>
            <button 
                onClick={toggleCurrency}
                className="bg-primary text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase"
            >
                تبديل
            </button>
        </section>

        {/* Bio Section for Experts */}
        {(user.role === "TRAINER" || user.role === "LAB_MANAGER") && (
          <section className="glass rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Info size={16} />
              </div>
              <h3 className="text-sm font-bold">{lang === "ar" ? "نبذة تعريفية (بايو)" : "Professional Bio"}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/30 uppercase px-1">العربية</label>
                <textarea 
                  defaultValue={user.bio_ar}
                  onBlur={(e) => updateDoc(doc(db, "users", user.uid), { bio_ar: e.target.value })}
                  placeholder="اكتب نبذة عن خبرتك بالعربية..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-3 text-xs min-h-[80px] focus:outline-none focus:border-primary/30 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/30 uppercase px-1">English</label>
                <textarea 
                  defaultValue={user.bio_en}
                  onBlur={(e) => updateDoc(doc(db, "users", user.uid), { bio_en: e.target.value })}
                  placeholder="Write about your expertise in English..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-3 text-xs min-h-[80px] focus:outline-none focus:border-primary/30 transition-colors"
                />
              </div>
              <p className="text-[9px] text-white/20 italic px-1">
                * {lang === "ar" ? "سيتم الحفظ تلقائياً عند الخروج من الحقل" : "Changes are saved automatically on blur"}
              </p>
            </div>
          </section>
        )}

        {/* Withdrawal Request Section for Experts */}
        {(user.role === "TRAINER" || user.role === "LAB_MANAGER") && (
          <WithdrawalSection user={user} lang={lang} />
        )}

        {/* Dashboards based on role */}
        <section className="space-y-3">
            <h3 className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] px-2">الإدارة والمهام</h3>
            
            {user.role === "ADMIN" && (
                <DashboardLink to="/admin" icon={<ShieldCheck className="text-blue-400" />} title="لوحة تحكم المدير" desc="إدارة المنيو، المختبر، والتحويلات المالية" />
            )}
            {user.role === "TRAINER" && (
                <DashboardLink to="/trainer" icon={<Trophy className="text-amber-400" />} title="لوحة تحكم المدرب" desc="الرد على الاستشارات وإرسال عروض السعر" />
            )}
            {user.role === "LAB_MANAGER" && (
                <DashboardLink to="/lab-manager" icon={<FlaskConical className="text-emerald-400" />} title="لوحة تحكم المختبر" desc="إدارة الفحوصات والرد على الاستفسارات" />
            )}
            
            {/* Common Links */}
            <DashboardLink to="/orders" icon={<Clock className="text-white/40" />} title="طلباتي السابقة" desc="تتبع الوجبات والتحاليل المحجوزة" />
            <DashboardLink to="/payment-methods" icon={<CreditCard className="text-white/40" />} title="طرق الدفع" desc="إدارة البطاقات والعناوين المحفوظة" />
            <DashboardLink to="/settings" icon={<Settings className="text-white/40" />} title="الإعدادات الشخصية" desc="تعديل الملف الشخصي والتنبيهات الصحية" />
        </section>

        {/* Logout */}
        <button 
            onClick={handleLogout}
            className="w-full py-4 glass rounded-2xl text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"
        >
            <LogOut size={18} />
            تسجيل الخروج
        </button>
      </main>
    </div>
  );
}

function WithdrawalSection({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
    const [showModal, setShowModal] = useState(false);
    const [method, setMethod] = useState<"BANK" | "WALLET">("WALLET");
    const [amount, setAmount] = useState("");
    const [phone, setPhone] = useState("");
    const [alias, setAlias] = useState("");
    const [loading, setLoading] = useState(false);

    const t = {
        title: lang === "ar" ? "طلب سحب رصيد" : "Request Withdrawal",
        desc: lang === "ar" ? "اسحب أرباحك إلى حسابك البنكي أو محفظتك" : "Withdraw your earnings to your bank or wallet",
        amount: lang === "ar" ? "المبلغ المراد سحبه" : "Amount to withdraw",
        method: lang === "ar" ? "طريقة التحويل" : "Transfer Method",
        bank: lang === "ar" ? "حساب بنكي" : "Bank Account",
        wallet: lang === "ar" ? "محافظ أردنية" : "Jordanian Wallets",
        phone: lang === "ar" ? "رقم الهاتف المرتبط" : "Linked Phone Number",
        alias: lang === "ar" ? "الاسم المستعار / اسم المستلم" : "Alias / Recipient Name",
        submit: lang === "ar" ? "إرسال الطلب" : "Submit Request",
        insufficient: lang === "ar" ? "رصيد غير كافٍ" : "Insufficient balance",
        success: lang === "ar" ? "تم إرسال الطلب بنجاح" : "Request sent successfully",
        cancel: lang === "ar" ? "إلغاء" : "Cancel"
    };

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > user.walletBalance) {
            alert(t.insufficient);
            return;
        }
        if (!phone || !alias) {
            alert(lang === "ar" ? "يرجى ملء جميع الحقول" : "Please fill all fields");
            return;
        }

        setLoading(true);
        try {
            const withdrawalAmount = parseFloat(amount);
            
            // 1. Create request
            await addDoc(collection(db, "withdrawal_requests"), {
                userId: user.uid,
                userName: getLocalizedString(user.name, lang),
                userRole: user.role,
                amount: withdrawalAmount,
                method,
                details: {
                    phoneNumber: phone,
                    alias: alias
                },
                status: "PENDING",
                createdAt: Date.now()
            });

            // 2. Deduct from wallet balance
            await updateDoc(doc(db, "users", user.uid), {
                walletBalance: increment(-withdrawalAmount)
            });

            alert(t.success);
            setShowModal(false);
            setAmount("");
            setPhone("");
            setAlias("");
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <>
            <section className="glass rounded-3xl p-5 border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold">{t.title}</h4>
                            <p className="text-[10px] text-white/30">{t.desc}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all"
                    >
                        {lang === "ar" ? "طلب سحب" : "Withdraw"}
                    </button>
                </div>
            </section>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-sm glass rounded-[2.5rem] p-8 border border-white/10 space-y-6 shadow-2xl relative"
                        >
                            <div className="text-center space-y-1">
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">{t.title}</h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{t.desc}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="glass rounded-2xl p-4 border border-white/5">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block px-1">{t.amount}</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            className="bg-transparent border-none focus:ring-0 text-xl font-black flex-1"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                        <span className="text-xs font-black text-primary italic">JOD</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block px-1">{t.method}</label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setMethod("WALLET")}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${method === "WALLET" ? "bg-primary text-black" : "glass text-white/40"}`}
                                        >
                                            {t.wallet}
                                        </button>
                                        <button 
                                            onClick={() => setMethod("BANK")}
                                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${method === "BANK" ? "bg-primary text-black" : "glass text-white/40"}`}
                                        >
                                            {t.bank}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="glass rounded-2xl px-4 py-3 border border-white/5">
                                        <input 
                                            type="text"
                                            placeholder={t.phone}
                                            className="bg-transparent border-none focus:ring-0 text-xs w-full"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="glass rounded-2xl px-4 py-3 border border-white/5">
                                        <input 
                                            type="text"
                                            placeholder={t.alias}
                                            className="bg-transparent border-none focus:ring-0 text-xs w-full"
                                            value={alias}
                                            onChange={(e) => setAlias(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        disabled={loading}
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 rounded-2xl glass text-[10px] font-black uppercase text-white/40 border-white/5"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button 
                                        disabled={loading}
                                        onClick={handleSubmit}
                                        className="flex-[2] py-4 rounded-2xl primary-gradient text-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : t.submit}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

function DashboardLink({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <Link to={to} className="glass rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {icon}
                </div>
                <div>
                    <h4 className="text-sm font-bold">{title}</h4>
                    <p className="text-[10px] text-white/30">{desc}</p>
                </div>
            </div>
            <ChevronLeft size={16} className="text-white/20 group-hover:text-primary transition-colors" />
        </Link>
    );
}
