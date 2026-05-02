import React, { useState, useEffect } from "react";
import { UserProfile, MenuItem, LabTest } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, setDoc, query, where } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, Wallet, Users, Utensils, FlaskConical, DollarSign, ArrowLeftRight, LayoutDashboard, FileText, ChevronRight, X, Save, Brain, Image as ImageIcon, Loader2, Tag } from "lucide-react";
import { UserRole } from "../types";
import { uploadImage } from "../services/imageService";
import { formatPrice } from "../lib/currency";
import { getLocalizedString } from "../lib/utils";

type AdminTab = "DASHBOARD" | "MENU" | "LABS" | "USERS" | "FINANCE" | "CONTENT" | "KNOWLEDGE" | "PROMO";

export default function AdminDashboard({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const [tab, setTab] = useState<AdminTab>("DASHBOARD");
  const [items, setItems] = useState<any[]>([]);
  const [experts, setExperts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Finance states
  const [transferTarget, setTransferTarget] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferCurrency, setTransferCurrency] = useState<"JOD" | "USD">("JOD");

  const t = {
    dashboardTitle: lang === "ar" ? "لوحة التحكم" : "Admin Dashboard",
    tabDashboard: lang === "ar" ? "الرئيسية" : "Dashboard",
    tabUsers: lang === "ar" ? "الحسابات" : "Users",
    tabMenu: lang === "ar" ? "المتجر والمنيو" : "Store & Menu",
    tabLabs: lang === "ar" ? "المختبر" : "Lab Services",
    tabContent: lang === "ar" ? "النصائح والإعلانات" : "Content & Ads",
    tabKnowledge: lang === "ar" ? "تدريب المساعد" : "AI Training",
    tabFinance: lang === "ar" ? "المالية" : "Finance",
    tabPromo: lang === "ar" ? "أكواد الخصم" : "Promo Codes",
    menuList: lang === "ar" ? "إدارة المنتجات" : "Product Management",
    categorySettings: lang === "ar" ? "صور الأقسام" : "Category Images",
    labsList: lang === "ar" ? "قائمة التحاليل" : "Lab List",
    promoList: lang === "ar" ? "قائمة الأكواد" : "Promo List",
    contentList: lang === "ar" ? "المحتوى الترويجي" : "Promo Content",
    knowledgeList: lang === "ar" ? "قاعدة بيانات الـ AI" : "AI Knowledge Base",
    usersList: lang === "ar" ? "إدارة الأعضاء" : "User Management",
    overview: lang === "ar" ? "نظرة عامة" : "Overview",
    paymentsList: lang === "ar" ? "حركات الدفع" : "Payment History",
    addNew: lang === "ar" ? "إضافة جديد" : "Add New",
    noRecords: lang === "ar" ? "لا توجد سجلات" : "No records found",
    transferFunds: lang === "ar" ? "تحويل أموال للخبراء" : "Transfer Funds to Experts",
    selectExpert: lang === "ar" ? "اختر الخبير (مدرب/مختبر)" : "Select Expert (Trainer/Lab)",
    amountPlaceholder: lang === "ar" ? "المبلغ المراد تحويله" : "Amount to transfer",
    confirmTransfer: lang === "ar" ? "تأكيد التحويل الآن" : "Confirm Transfer Now",
    lastTransfers: lang === "ar" ? "آخر التحويلات" : "Recent Transfers",
    transferSuccess: lang === "ar" ? "تم التحويل بنجاح" : "Transfer successful",
    confirmDelete: lang === "ar" ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?",
    user: lang === "ar" ? "مستخدم" : "User",
    admin: lang === "ar" ? "ادمن" : "Admin",
    trainerRole: lang === "ar" ? "مدرب" : "Trainer",
    labManagerRole: lang === "ar" ? "مدير مختبر" : "Lab Manager",
    accountantRole: lang === "ar" ? "محاسب" : "Accountant",
    aiKnowledgeDesc: lang === "ar" ? "سؤال وجواب للمساعد" : "AI Question & Answer",
    editData: lang === "ar" ? "تعديل البيانات" : "Edit Data",
    addNewRecord: lang === "ar" ? "إضافة سجل جديد" : "Add New Record",
    imageUploadFail: lang === "ar" ? "فشل رفع الصورة" : "Image upload failed",
    saveChanges: lang === "ar" ? "حفظ التغييرات" : "Save Changes",
    catMenu: lang === "ar" ? "قسم المنيو" : "Dining Menu",
    catSupplements: lang === "ar" ? "قسم المكملات الغذائية" : "Supplements",
    catBasil: lang === "ar" ? "قسم منتجات الريحان" : "Basil Products"
  };

  useEffect(() => {
    fetchTabContent();
    if (tab === "FINANCE") fetchExperts();
  }, [tab]);

  const fetchTabContent = async () => {
    setLoading(true);
    let snap;
    try {
        if (tab === "MENU") snap = await getDocs(collection(db, "menu"));
        else if (tab === "LABS") snap = await getDocs(collection(db, "labs"));
        else if (tab === "USERS") snap = await getDocs(collection(db, "users"));
        else if (tab === "FINANCE") snap = await getDocs(collection(db, "payments"));
        else if (tab === "CONTENT") snap = await getDocs(collection(db, "content"));
        else if (tab === "KNOWLEDGE") snap = await getDocs(collection(db, "knowledge_base"));
        else if (tab === "PROMO") snap = await getDocs(collection(db, "promo_codes"));
        
        if (snap) {
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  const fetchExperts = async () => {
    const q = query(collection(db, "users"), where("role", "in", ["TRAINER", "LAB_MANAGER"]));
    const snap = await getDocs(q);
    setExperts(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
  };

  const handleSave = async (data: any) => {
    setLoading(true);
    try {
        const collectionName = tab === "MENU" ? "menu" : tab === "LABS" ? "labs" : tab === "CONTENT" ? "content" : tab === "KNOWLEDGE" ? "knowledge_base" : tab === "PROMO" ? "promo_codes" : "users";
        if (editingItem?.id || editingItem?.uid) {
            const id = editingItem.id || editingItem.uid;
            await updateDoc(doc(db, collectionName, id), data);
        } else {
            await addDoc(collection(db, collectionName), { ...data, createdAt: Date.now() });
        }
        setEditingItem(null);
        setIsAdding(false);
        fetchTabContent();
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  const changeUserRole = async (userId: string, newRole: UserRole) => {
    setLoading(true);
    try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        fetchTabContent();
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  const handleTransfer = async () => {
    if (!transferTarget || !transferAmount) return;
    setLoading(true);
    try {
        const amount = parseFloat(transferAmount);
        const expertRef = doc(db, "users", transferTarget);
        const expertSnap = await getDoc(expertRef);
        
        if (expertSnap.exists()) {
            const currentBalance = expertSnap.data().walletBalance || 0;
            await updateDoc(expertRef, { walletBalance: currentBalance + amount });
            
            // Log payment
            await addDoc(collection(db, "payments"), {
                targetUid: transferTarget,
                targetName: expertSnap.data().name,
                amount: amount,
                currency: transferCurrency,
                type: "TRANSFER",
                timestamp: Date.now()
            });
            
            setTransferAmount("");
            alert(t.transferSuccess);
            fetchTabContent();
        }
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    setLoading(true);
    try {
        const collectionName = tab === "MENU" ? "menu" : tab === "LABS" ? "labs" : tab === "CONTENT" ? "content" : tab === "KNOWLEDGE" ? "knowledge_base" : tab === "PROMO" ? "promo_codes" : "users";
        await deleteDoc(doc(db, collectionName, id));
        fetchTabContent();
    } catch (err) {
        console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 pb-32 min-h-screen bg-[#0a0c10]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {(editingItem || isAdding) && (
            <DetailView
                item={editingItem || {}}
                type={tab}
                lang={lang}
                onClose={() => { setEditingItem(null); setIsAdding(false); }}
                onSave={handleSave}
            />
        )}
      </AnimatePresence>

      <header className="p-4 pt-12 space-y-4 sticky top-0 bg-[#0a0c10]/80 backdrop-blur-xl z-30">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black italic tracking-tighter">{t.dashboardTitle}</h1>
            <div className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center text-primary">
                <LayoutDashboard size={20} />
            </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          <TabButton active={tab === "DASHBOARD"} onClick={() => setTab("DASHBOARD")} icon={<LayoutDashboard size={14} />} label={t.tabDashboard} />
          <TabButton active={tab === "USERS"} onClick={() => setTab("USERS")} icon={<Users size={14} />} label={t.tabUsers} />
          <TabButton active={tab === "MENU"} onClick={() => setTab("MENU")} icon={<Utensils size={14} />} label={t.tabMenu} />
          <TabButton active={tab === "LABS"} onClick={() => setTab("LABS")} icon={<FlaskConical size={14} />} label={t.tabLabs} />
          <TabButton active={tab === "CONTENT"} onClick={() => setTab("CONTENT")} icon={<FileText size={14} />} label={t.tabContent} />
          <TabButton active={tab === "KNOWLEDGE"} onClick={() => setTab("KNOWLEDGE")} icon={<Brain size={14} />} label={t.tabKnowledge} />
          <TabButton active={tab === "PROMO"} onClick={() => setTab("PROMO")} icon={<Tag size={14} />} label={t.tabPromo} />
          <TabButton active={tab === "FINANCE"} onClick={() => setTab("FINANCE")} icon={<DollarSign size={14} />} label={t.tabFinance} />
        </div>
      </header>

      <main className="p-4 space-y-6 flex-1">
        {tab === "DASHBOARD" && <StatsSection lang={lang} />}

        {tab === "MENU" && <CategorySettingsSection lang={lang} user={user} />}

        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black tracking-tight uppercase italic underline decoration-primary/30 decoration-4 underline-offset-4">
                {tab === "MENU" ? t.menuList : 
                 tab === "LABS" ? t.labsList : 
                 tab === "PROMO" ? t.promoList :
                 tab === "CONTENT" ? t.contentList :
                 tab === "KNOWLEDGE" ? t.knowledgeList :
                 tab === "USERS" ? t.usersList : 
                 tab === "DASHBOARD" ? t.overview : t.paymentsList}
            </h2>
            {["MENU", "LABS", "CONTENT", "KNOWLEDGE", "PROMO"].includes(tab) && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-primary text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <Plus size={16} /> {t.addNew}
                </button>
            )}
        </div>

        <section className="space-y-3">
            {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-24 glass rounded-3xl animate-pulse" />)
            ) : items.length > 0 ? (
                items.map((item, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: idx * 0.05 }}
                        key={item.id || item.uid} 
                        className="glass rounded-3xl p-4 flex items-center justify-between group border border-white/5 hover:border-primary/20 transition-all"
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                {item.image ? (
                                    <img src={item.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <Users className="text-white/20" size={20} />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-black truncate max-w-[150px]">
                                    {tab === "PROMO" ? item.code : (getLocalizedString(item.name || item.title || item.question, lang) || item.email || "No Name")}
                                </h4>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">
                                    {tab === "KNOWLEDGE" ? t.aiKnowledgeDesc : tab === "USERS" ? (
                                        <select 
                                            value={item.role} 
                                            onChange={(e) => changeUserRole(item.uid, e.target.value as UserRole)}
                                            className="bg-transparent border-none p-0 focus:ring-0 text-primary cursor-pointer"
                                        >
                                            <option value="USER" className="bg-background-dark">{t.user}</option>
                                            <option value="TRAINER" className="bg-background-dark">{t.trainerRole}</option>
                                            <option value="ADMIN" className="bg-background-dark">{t.admin}</option>
                                            <option value="LAB_MANAGER" className="bg-background-dark">{t.labManagerRole}</option>
                                            <option value="ACCOUNTANT" className="bg-background-dark">{t.accountantRole}</option>
                                        </select>
                                    ) : tab === "PROMO" ? (
                                        `${item.discountValue}${item.discountType === "PERCENTAGE" ? "%" : ""} - ${item.isActive ? "Active" : "Inactive"}`
                                    ) : (item.category || item.type || formatPrice(item.price || 0, user, item.currency))}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {tab !== "FINANCE" && tab !== "USERS" && (
                                <button 
                                    onClick={() => setEditingItem(item)}
                                    className="p-2 text-white/40 hover:text-primary transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                            {tab !== "FINANCE" && (
                                <button 
                                    onClick={() => handleDelete(item.id || item.uid)}
                                    className="p-2 text-red-500/20 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))
            ) : tab !== "DASHBOARD" && tab !== "FINANCE" && (
                <div className="text-center py-20 text-white/20 border-4 border-dashed border-white/5 rounded-[3rem]">
                    <Plus size={40} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t.noRecords}</p>
                </div>
            )}
        </section>

        {tab === "FINANCE" && (
            <section className="space-y-4 pt-4">
                <div className="primary-gradient p-6 rounded-[2.5rem] text-background-dark space-y-4 shadow-xl shadow-primary/20">
                    <h3 className="font-black flex items-center gap-2 italic uppercase">
                        <Wallet size={18} /> {t.transferFunds}
                    </h3>
                    <div className="space-y-3">
                        <select 
                            value={transferTarget}
                            onChange={(e) => setTransferTarget(e.target.value)}
                            className="w-full bg-white/20 border-none rounded-2xl text-sm py-4 px-4 font-bold cursor-pointer"
                        >
                            <option value="">{t.selectExpert}</option>
                            {experts.map(ex => (
                                <option key={ex.uid} value={ex.uid} className="bg-background-dark text-white">
                                    {typeof ex.name === 'object' ? (ex.name[lang] || ex.name["en"]) : ex.name} ({ex.role})
                                </option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                              <input 
                                  type="number" 
                                  placeholder={t.amountPlaceholder}
                                  className="w-full bg-white/20 border-none rounded-2xl placeholder:text-black/30 text-sm py-4 px-4 font-bold" 
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                              />
                          </div>
                          <select 
                            value={transferCurrency}
                            onChange={(e) => setTransferCurrency(e.target.value as any)}
                            className="bg-white/20 border-none rounded-2xl text-[10px] font-black px-4 cursor-pointer"
                          >
                            <option value="JOD">JOD</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                        <button 
                            onClick={handleTransfer}
                            className="w-full bg-background-dark text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            {t.confirmTransfer}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-2 text-white/30">{t.lastTransfers}</h3>
                    {items.map((pay) => (
                        <div key={pay.id} className="glass rounded-2xl p-4 flex justify-between items-center border border-white/5">
                            <div>
                                <p className="text-xs font-bold">{pay.targetName}</p>
                                <p className="text-[10px] text-white/30">{new Date(pay.timestamp).toLocaleDateString(lang === 'ar' ? "ar-SA" : "en-US")}</p>
                            </div>
                            <p className="text-primary font-black">+{formatPrice(pay.amount, user, pay.currency)}</p>
                        </div>
                    ))}
                </div>
            </section>
        )}
      </main>
    </div>
  );
}

function DetailView({ item, type, lang, onClose, onSave }: any) {
    const [formData, setFormData] = useState(item);
    const [isUploading, setIsUploading] = useState(false);

    const t = {
        editData: lang === "ar" ? "تعديل البيانات" : "Edit Data",
        addNewRecord: lang === "ar" ? "إضافة سجل جديد" : "Add New Record",
        imageUploadFail: lang === "ar" ? "فشل رفع الصورة" : "Image upload failed",
        saveChanges: lang === "ar" ? "حفظ التغييرات" : "Save Changes",
        nameAr: lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
        nameEn: lang === "ar" ? "Name (EN)" : "Name (English)",
        descAr: lang === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
        descEn: lang === "ar" ? "Description (EN)" : "Description (English)",
        price: lang === "ar" ? "السعر" : "Price",
        currency: lang === "ar" ? "العملة" : "Currency",
        imagePlaceholder: lang === "ar" ? "الصورة" : "Image",
        clickToUpload: lang === "ar" ? "اضغط لرفع صورة" : "Click to upload image",
        imageUrl: lang === "ar" ? "رابط الصورة (اختياري)" : "Image URL (optional)",
        calories: lang === "ar" ? "السعرات" : "Calories",
        protein: lang === "ar" ? "بروتين" : "Protein",
        carbs: lang === "ar" ? "كارب" : "Carbs",
        fats: lang === "ar" ? "دهون" : "Fats",
        category: lang === "ar" ? "التصنيف" : "Category",
        contentDesc: lang === "ar" ? "الوصف / المحتوى" : "Description / Content",
        contentType: lang === "ar" ? "النوع (advice/promo)" : "Type (advice/promo)",
        question: lang === "ar" ? "السؤال" : "Question",
        answer: lang === "ar" ? "الجواب المثالي من الـ AI" : "Perfect AI Answer",
        role: lang === "ar" ? "الدور" : "Role",
        bioAr: lang === "ar" ? "السيرة (عربي)" : "Bio (Arabic)",
        bioEn: lang === "ar" ? "Bio (EN)" : "Bio (English)",
        consultationFee: lang === "ar" ? "سجل الاستشارة" : "Consultation Fee",
        serviceCurrency: lang === "ar" ? "عملة الخدمة" : "Service Currency",
        walletBalance: lang === "ar" ? "الرصيد" : "Wallet Balance",
        accountCurrency: lang === "ar" ? "عملة الحساب" : "Account Currency",
        promoCode: lang === "ar" ? "الكود" : "Promo Code",
        discountType: lang === "ar" ? "نوع الخصم" : "Discount Type",
        discountValue: lang === "ar" ? "قيمة الخصم" : "Discount Value",
        expiryDate: lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date",
        maxDiscount: lang === "ar" ? "أقصى خصم" : "Max Discount",
        minOrderValue: lang === "ar" ? "أقل قيمة للطلب" : "Min Order Value",
        usageLimit: lang === "ar" ? "حد الاستخدام" : "Usage Limit",
        isActive: lang === "ar" ? "مفعل" : "Is Active",
        percentage: lang === "ar" ? "نسبة مئوية" : "Percentage",
        fixed: lang === "ar" ? "مبلغ ثابت" : "Fixed Amount",
        catMenu: lang === "ar" ? "قسم المنيو" : "Dining Menu",
        catSupplements: lang === "ar" ? "قسم المكملات الغذائية" : "Supplements",
        catBasil: lang === "ar" ? "قسم منتجات الريحان" : "Basil Products"
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadImage(file);
            setFormData({ ...formData, image: url });
        } catch (err) {
            alert(t.imageUploadFail);
        }
        setIsUploading(false);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="glass w-full max-w-lg rounded-[3rem] p-8 space-y-6 border border-white/10 relative my-auto shadow-2xl"
            >
                <button onClick={onClose} className={`absolute ${lang === 'ar' ? 'left-6' : 'right-6'} top-6 w-10 h-10 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors`}>
                    <X size={20} />
                </button>

                <div className="space-y-1">
                    <h3 className="text-2xl font-black italic tracking-tighter">{item.id ? t.editData : t.addNewRecord}</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{type} Management</p>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                    {type === "PROMO" ? (
                        <>
                            <InputField label={t.promoCode} value={formData.code || ""} onChange={(v: string) => setFormData({...formData, code: v.toUpperCase()})} />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{t.discountType}</label>
                                    <div className="glass rounded-2xl px-5 border border-white/5 mt-2 overflow-hidden">
                                        <select 
                                            value={formData.discountType || "PERCENTAGE"} 
                                            onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                                            className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 text-white cursor-pointer"
                                        >
                                            <option value="PERCENTAGE" className="bg-background-dark">{t.percentage}</option>
                                            <option value="FIXED" className="bg-background-dark">{t.fixed}</option>
                                        </select>
                                    </div>
                                </div>
                                <InputField label={t.discountValue} value={formData.discountValue || ""} type="number" onChange={(v: any) => setFormData({...formData, discountValue: parseFloat(v)})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label={t.maxDiscount} value={formData.maxDiscount || ""} type="number" onChange={(v: any) => setFormData({...formData, maxDiscount: parseFloat(v)})} />
                                <InputField label={t.minOrderValue} value={formData.minOrderValue || ""} type="number" onChange={(v: any) => setFormData({...formData, minOrderValue: parseFloat(v)})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label={t.expiryDate} value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ""} type="date" onChange={(v: any) => setFormData({...formData, expiryDate: new Date(v).getTime()})} />
                                <InputField label={t.usageLimit} value={formData.usageLimit || ""} type="number" onChange={(v: any) => setFormData({...formData, usageLimit: parseInt(v)})} />
                            </div>
                            <div className="flex items-center gap-3 px-2">
                                <input 
                                    type="checkbox" 
                                    checked={formData.isActive ?? true} 
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                    className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20"
                                />
                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t.isActive}</span>
                            </div>
                        </>
                    ) : ["MENU", "LABS", "USERS"].includes(type) ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField label={t.nameAr} value={typeof formData.name === 'object' ? (formData.name?.ar || "") : (formData.name || "")} onChange={(v: string) => setFormData({...formData, name: { ...(typeof formData.name === 'object' ? formData.name : {}), ar: v }})} />
                                <InputField label={t.nameEn} value={typeof formData.name === 'object' ? (formData.name?.en || "") : ""} onChange={(v: string) => setFormData({...formData, name: { ...(typeof formData.name === 'object' ? formData.name : {}), en: v }})} />
                            </div>
                            {type !== "USERS" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label={t.descAr} value={formData.description?.ar || ""} isTextArea onChange={(v: string) => setFormData({...formData, description: { ...(formData.description || {}), ar: v }})} />
                                    <InputField label={t.descEn} value={formData.description?.en || ""} isTextArea onChange={(v: string) => setFormData({...formData, description: { ...(formData.description || {}), en: v }})} />
                                </div>
                            )}
                        </>
                    ) : (
                        <InputField label={lang === 'ar' ? "الاسم / العنوان" : "Name / Title"} value={formData.name || formData.title || ""} onChange={(v: any) => setFormData({...formData, name: v, title: v})} />
                    )}
                    
                    {["MENU", "LABS"].includes(type) && (
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <InputField label={t.price} value={formData.price || ""} type="number" onChange={(v: any) => setFormData({...formData, price: parseFloat(v)})} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{t.currency}</label>
                                    <div className="glass rounded-2xl px-5 border border-white/5 mt-2 overflow-hidden">
                                        <select 
                                            value={formData.currency || "JOD"} 
                                            onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                            className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 text-white cursor-pointer"
                                        >
                                            <option value="JOD" className="bg-background-dark">دينار أردني (JOD)</option>
                                            <option value="USD" className="bg-background-dark">دولار أمريكي (USD)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{t.imagePlaceholder}</label>
                            <label className="glass rounded-3xl p-6 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group overflow-hidden relative min-h-[120px]">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                ) : formData.image ? (
                                    <img src={formData.image} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="" />
                                ) : (
                                    <>
                                        <ImageIcon className="text-white/20 mb-2" size={32} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{t.clickToUpload}</span>
                                    </>
                                )}
                            </label>
                            <InputField label={t.imageUrl} value={formData.image || ""} onChange={(v: any) => setFormData({...formData, image: v})} />
                        </div>
                    )}

                    {type === "MENU" && (
                        <>
                            <InputField label={t.calories} value={formData.calories || ""} type="number" onChange={(v: any) => setFormData({...formData, calories: parseInt(v)})} />
                            <div className="grid grid-cols-3 gap-2">
                                <InputField label={t.protein} value={formData.protein || ""} type="number" onChange={(v: any) => setFormData({...formData, protein: parseFloat(v)})} />
                                <InputField label={t.carbs} value={formData.carbs || ""} type="number" onChange={(v: any) => setFormData({...formData, carbs: parseFloat(v)})} />
                                <InputField label={t.fats} value={formData.fats || ""} type="number" onChange={(v: any) => setFormData({...formData, fats: parseFloat(v)})} />
                            </div>
                        </>
                    )}

                    {type === "MENU" && (
                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{t.category}</label>
                             <div className="glass rounded-2xl px-5 border border-white/5 mt-2 overflow-hidden">
                                 <select 
                                     value={formData.category || "MENU"} 
                                     onChange={(e) => setFormData({...formData, category: e.target.value})}
                                     className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 text-white cursor-pointer"
                                 >
                                     <option value="MENU" className="bg-background-dark">{t.catMenu}</option>
                                     <option value="SUPPLEMENTS" className="bg-background-dark">{t.catSupplements}</option>
                                     <option value="BASIL" className="bg-background-dark">{t.catBasil}</option>
                                 </select>
                             </div>
                        </div>
                    )}

                    {type === "LABS" && (
                        <InputField label={t.category} value={formData.category || ""} onChange={(v: any) => setFormData({...formData, category: v})} />
                    )}

                    {type === "CONTENT" && (
                        <>
                            <InputField label={t.contentDesc} value={formData.description || ""} isTextArea onChange={(v: string) => setFormData({...formData, description: v})} />
                            <InputField label={t.contentType} value={formData.type || "advice"} onChange={(v: string) => setFormData({...formData, type: v})} />
                        </>
                    )}

                    {type === "KNOWLEDGE" && (
                        <>
                            <InputField label={t.question} value={formData.question || ""} isTextArea onChange={(v: string) => setFormData({...formData, question: v})} />
                            <InputField label={t.answer} value={formData.answer || ""} isTextArea onChange={(v: string) => setFormData({...formData, answer: v})} />
                        </>
                    )}

                    {type === "USERS" && (
                        <>
                            <InputField label={t.role} value={formData.role || "USER"} onChange={(v: any) => setFormData({...formData, role: v})} />
                            
                            {["TRAINER", "LAB_MANAGER"].includes(formData.role) && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label={t.bioAr} value={formData.bio?.ar || ""} isTextArea onChange={(v: string) => setFormData({...formData, bio: { ...(formData.bio || {}), ar: v }})} />
                                        <InputField label={t.bioEn} value={formData.bio?.en || ""} isTextArea onChange={(v: string) => setFormData({...formData, bio: { ...(formData.bio || {}), en: v }})} />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <InputField label={t.consultationFee} value={formData.price || 0} type="number" onChange={(v: any) => setFormData({...formData, price: parseFloat(v)})} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{t.serviceCurrency}</label>
                                            <div className="glass rounded-2xl px-5 border border-white/5 mt-2 overflow-hidden">
                                                <select 
                                                    value={formData.serviceCurrency || "JOD"} 
                                                    onChange={(e) => setFormData({...formData, serviceCurrency: e.target.value})}
                                                    className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 text-white cursor-pointer"
                                                >
                                                    <option value="JOD" className="bg-background-dark">JOD</option>
                                                    <option value="USD" className="bg-background-dark">USD</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <InputField label={t.walletBalance} value={formData.walletBalance || 0} type="number" onChange={(v: any) => setFormData({...formData, walletBalance: parseFloat(v)})} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{t.accountCurrency}</label>
                                    <div className="glass rounded-2xl px-5 border border-white/5 mt-2 overflow-hidden">
                                        <select 
                                            value={formData.currency || "JOD"} 
                                            onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                            className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 text-white cursor-pointer"
                                        >
                                            <option value="JOD" className="bg-background-dark">JOD</option>
                                            <option value="USD" className="bg-background-dark">USD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button 
                    onClick={() => onSave(formData)}
                    className="w-full bg-primary text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                    <Save size={18} /> {t.saveChanges}
                </button>
            </motion.div>
        </motion.div>
    );
}

function InputField({ label, value, onChange, type = "text", isTextArea = false }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2">{label}</label>
            <div className="glass rounded-2xl px-5 border border-white/5 focus-within:border-primary/50 transition-all">
                {isTextArea ? (
                    <textarea 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 resize-none" 
                        rows={4}
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <input 
                        type={type} 
                        className="bg-transparent border-none focus:ring-0 text-sm w-full py-4" 
                        value={value} 
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}
            </div>
        </div>
    );
}

function StatsSection({ lang }: { lang: string }) {
    const t = {
        users: lang === "ar" ? "المشتركين" : "Subscribers",
        revenue: lang === "ar" ? "الإيرادات" : "Revenue",
        meals: lang === "ar" ? "الوجبات" : "Meals",
        labs: lang === "ar" ? "التحاليل" : "Labs"
    };
    return (
        <div className="grid grid-cols-2 gap-4">
            <StatItem icon={<Users size={20} />} label={t.users} val="1.2k" color="primary" />
            <StatItem icon={<DollarSign size={20} />} label={t.revenue} val="45k" color="amber" />
            <StatItem icon={<Utensils size={20} />} label={t.meals} val="64" color="blue" />
            <StatItem icon={<FlaskConical size={20} />} label={t.labs} val="28" color="purple" />
        </div>
    );
}

function CategorySettingsSection({ lang, user }: { lang: "ar" | "en", user: UserProfile }) {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: "MENU", ar: "قسم المنيو", en: "Dining Menu" },
        { id: "SUPPLEMENTS", ar: "قسم المكملات الغذائية", en: "Supplements" },
        { id: "BASIL", ar: "قسم منتجات الريحان", en: "Basil Products" }
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            const snap = await getDocs(collection(db, "category_settings"));
            setSettings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const updateImage = async (catId: string, file: File) => {
        try {
            const url = await uploadImage(file);
            await setDoc(doc(db, "category_settings", catId), { image: url }, { merge: true });
            const snap = await getDocs(collection(db, "category_settings"));
            setSettings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-4 mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] px-2 text-white/30">
                {lang === "ar" ? "صور الأقسام الرئيسية في المتجر" : "Main Category Images"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categories.map(cat => {
                    const setting = settings.find(s => s.id === cat.id);
                    return (
                        <div key={cat.id} className="glass rounded-3xl p-4 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-tighter text-primary">
                                    {lang === "ar" ? cat.ar : cat.en}
                                </span>
                            </div>
                            <label className="block aspect-[16/9] rounded-2xl bg-white/5 border border-dashed border-white/10 relative overflow-hidden cursor-pointer group">
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && updateImage(cat.id, e.target.files[0])} />
                                {setting?.image ? (
                                    <img src={setting.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-white/10 uppercase font-black text-[10px]">
                                        Upload Image
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ImageIcon size={24} className="text-white" />
                                </div>
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StatItem({ icon, label, val, color }: any) {
    const colors: any = {
        primary: "text-primary border-l-primary shadow-primary/5",
        amber: "text-amber-400 border-l-amber-400 shadow-amber-400/5",
        blue: "text-blue-400 border-l-blue-400 shadow-blue-400/5",
        purple: "text-purple-400 border-l-purple-400 shadow-purple-400/5"
    };
    return (
        <div className={`glass rounded-3xl p-6 border-l-4 shadow-xl ${colors[color]}`}>
            <div className="flex items-center gap-3 mb-2 opacity-50">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-3xl font-black italic tracking-tighter">{val}</p>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase whitespace-nowrap transition-all ${
                active ? "bg-primary text-black shadow-xl shadow-primary/20 rotate-1" : "glass text-white/40 hover:text-white"
            }`}
        >
            {icon} {label}
        </button>
    );
}
