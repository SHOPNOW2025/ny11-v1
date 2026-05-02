import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, WithdrawalRequest } from "../types";
import { formatPrice } from "../lib/currency";
import { motion, AnimatePresence } from "motion/react";
import { 
    Wallet, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Search,
    ChevronDown,
    User,
    Info,
    AlertCircle
} from "lucide-react";

export default function AccountantDashboard({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [trainers, setTrainers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<"REQUESTS" | "TRAINERS">("REQUESTS");

    useEffect(() => {
        const q = query(collection(db, "withdrawal_requests"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as WithdrawalRequest)));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchTrainers = async () => {
            const q = query(collection(db, "users"), where("role", "==", "TRAINER"));
            const snap = await getDocs(q);
            setTrainers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
        };
        fetchTrainers();
    }, []);

    const t = {
        title: lang === "ar" ? "لوحة تحكم المحاسب" : "Accountant Dashboard",
        requests: lang === "ar" ? "طلبات السحب" : "Withdrawal Requests",
        manageBalances: lang === "ar" ? "إدارة أرصدة المدربين" : "Manage Trainer Balances",
        trainerName: lang === "ar" ? "اسم المدرب" : "Trainer Name",
        balance: lang === "ar" ? "الرصيد الحالي" : "Current Balance",
        addBalance: lang === "ar" ? "إضافة رصيد" : "Add Balance",
        deductBalance: lang === "ar" ? "خصم رصيد" : "Deduct Balance",
        amount: lang === "ar" ? "المبلغ" : "Amount",
        reason: lang === "ar" ? "السبب / الملاحظات" : "Reason / Notes",
        confirm: lang === "ar" ? "تأكيد" : "Confirm",
        cancel: lang === "ar" ? "إلغاء" : "Cancel",
        statusPending: lang === "ar" ? "قيد الانتظار" : "Pending",
        statusApproved: lang === "ar" ? "تم القبول" : "Approved",
        statusRejected: lang === "ar" ? "تم الرفض" : "Rejected",
        details: lang === "ar" ? "التفاصيل" : "Details",
        action: lang === "ar" ? "إجراء" : "Action",
        rejectReason: lang === "ar" ? "سبب الرفض" : "Rejection Reason",
        phone: lang === "ar" ? "رقم الهاتف" : "Phone",
        alias: lang === "ar" ? "الاسم المستعار" : "Alias",
        method: lang === "ar" ? "طريقة التحويل" : "Transfer Method",
        bank: lang === "ar" ? "بنك" : "Bank",
        wallet: lang === "ar" ? "محفظة" : "Wallet"
    };

    const handleAction = async (requestId: string, userId: string, amount: number, status: "APPROVED" | "REJECTED", reason?: string) => {
        try {
            await updateDoc(doc(db, "withdrawal_requests", requestId), {
                status,
                reason: reason || "",
                updatedAt: Date.now()
            });

            if (status === "APPROVED") {
                // For approval, we don't necessarily deduct here because it should have been deducted on request creation 
                // OR we deduct now. In this logic, let's assume we deduct when requested to "lock" the balance.
                // If rejected, we refund.
            } else if (status === "REJECTED") {
                await updateDoc(doc(db, "users", userId), {
                    walletBalance: increment(amount)
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateTrainerBalance = async (trainerId: string, amount: number, type: "ADD" | "DEDUCT") => {
        const finalAmount = type === "ADD" ? amount : -amount;
        await updateDoc(doc(db, "users", trainerId), {
            walletBalance: increment(finalAmount)
        });
        // Refresh local state
        setTrainers(trainers.map(t => t.uid === trainerId ? { ...t, walletBalance: (t.walletBalance || 0) + finalAmount } : t));
    };

    return (
        <div className="flex-1 flex flex-col pb-32">
            <header className="p-6 pt-12 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase">{t.title}</h1>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">Financial Control</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab("REQUESTS")}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === "REQUESTS" ? "primary-gradient text-black" : "glass text-white/40"}`}
                    >
                        {t.requests}
                    </button>
                    <button 
                        onClick={() => setActiveTab("TRAINERS")}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === "TRAINERS" ? "primary-gradient text-black" : "glass text-white/40"}`}
                    >
                        {t.manageBalances}
                    </button>
                </div>
            </header>

            <main className="px-6 space-y-6">
                {activeTab === "REQUESTS" ? (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="glass rounded-[2rem] p-12 text-center border-white/5 border-dashed border">
                                <Clock size={40} className="mx-auto mb-4 text-white/10" />
                                <p className="text-white/20 font-black uppercase text-[10px] tracking-widest">No pending requests</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <RequestCard key={req.id} req={req} t={t} onAction={handleAction} lang={lang} />
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="glass rounded-2xl p-4 flex items-center gap-3 border-white/5">
                            <Search size={16} className="text-white/20" />
                            <input 
                                type="text" 
                                placeholder={lang === "ar" ? "ابحث عن مدرب..." : "Search trainers..."}
                                className="bg-transparent border-none focus:ring-0 text-sm flex-1"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        
                        {trainers.filter(tr => tr.name?.ar?.includes(search) || tr.name?.en?.includes(search)).map(tr => (
                            <TrainerBalanceCard key={tr.uid} trainer={tr} t={t} lang={lang} onUpdate={updateTrainerBalance} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function RequestCard({ req, t, onAction, lang }: any) {
    const [showActions, setShowActions] = useState(req.status === "PENDING");
    const [reason, setReason] = useState("");

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[2rem] p-6 border-white/5 space-y-5">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase">{req.userName}</h4>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{req.userRole}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black text-white">{formatPrice(req.amount, null, "JOD")}</p>
                    <p className="text-[9px] text-white/30 uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-xl p-3 border-white/5">
                    <p className="text-[8px] text-white/30 uppercase font-black mb-1">{t.method}</p>
                    <p className="text-[10px] font-bold text-primary">{req.method === "BANK" ? t.bank : t.wallet}</p>
                </div>
                <div className="glass rounded-xl p-3 border-white/5">
                    <p className="text-[8px] text-white/30 uppercase font-black mb-1">{t.phone}</p>
                    <p className="text-[10px] font-bold text-white">{req.details.phoneNumber}</p>
                </div>
                <div className="glass rounded-xl p-3 border-white/5 col-span-2">
                    <p className="text-[8px] text-white/30 uppercase font-black mb-1">{t.alias}</p>
                    <p className="text-[10px] font-bold text-white">{req.details.alias}</p>
                </div>
            </div>

            {req.status === "PENDING" && showActions ? (
                <div className="space-y-3 pt-2">
                    <textarea 
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs min-h-[80px] focus:outline-none focus:border-primary/40 transition-all"
                        placeholder={t.reason}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => onAction(req.id, req.userId, req.amount, "APPROVED", reason)}
                            className="flex-1 bg-primary text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <CheckCircle2 size={16} />
                            {t.statusApproved}
                        </button>
                        <button 
                            onClick={() => onAction(req.id, req.userId, req.amount, "REJECTED", reason)}
                            className="flex-1 bg-red-500/20 text-red-500 border border-red-500/20 font-black py-4 rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <XCircle size={16} />
                            {t.statusRejected}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pt-2 flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        req.status === "APPROVED" ? "bg-primary/10 text-primary" : 
                        req.status === "REJECTED" ? "bg-red-500/10 text-red-500" : "bg-white/5 text-white/30"
                    }`}>
                        {req.status === "APPROVED" ? <CheckCircle2 size={12} /> : req.status === "REJECTED" ? <XCircle size={12} /> : <Clock size={12} />}
                        {req.status === "APPROVED" ? t.statusApproved : req.status === "REJECTED" ? t.statusRejected : t.statusPending}
                    </div>
                    {req.reason && (
                        <div className="flex-1 glass rounded-lg px-4 py-2 text-[10px] text-white/50 italic truncate border-white/5">
                            {req.reason}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}

function TrainerBalanceCard({ trainer, t, lang, onUpdate }: any) {
    const [amount, setAmount] = useState("");
    const [showModal, setShowModal] = useState<"ADD" | "DEDUCT" | null>(null);

    return (
        <div className="glass rounded-[2rem] p-6 border-white/5 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={trainer.profilePic || trainer.image || "https://ui-avatars.com/api/?name=" + (trainer.name?.[lang] || "U")} className="w-12 h-12 rounded-2xl object-cover glass border border-white/5" alt="" />
                    <div>
                        <h4 className="text-sm font-black uppercase">{trainer.name?.[lang]}</h4>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{t.balance}: <span className="text-primary font-black">{formatPrice(trainer.walletBalance || 0, null, "JOD")}</span></p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <button 
                    onClick={() => setShowModal("ADD")}
                    className="flex-1 glass text-[10px] font-black py-4 rounded-xl flex items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-all uppercase tracking-widest border border-primary/20"
                >
                    <ArrowUpCircle size={16} />
                    {t.addBalance}
                </button>
                <button 
                    onClick={() => setShowModal("DEDUCT")}
                    className="flex-1 glass text-[10px] font-black py-4 rounded-xl flex items-center justify-center gap-2 text-red-400 hover:bg-red-400/10 transition-all uppercase tracking-widest border border-red-400/20"
                >
                    <ArrowDownCircle size={16} />
                    {t.deductBalance}
                </button>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-sm glass rounded-[2.5rem] p-8 border-white/10 space-y-6 shadow-2xl"
                        >
                            <div className="text-center space-y-1">
                                <div className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-2 ${showModal === 'ADD' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'}`}>
                                    {showModal === 'ADD' ? <ArrowUpCircle size={32} /> : <ArrowDownCircle size={32} />}
                                </div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter">
                                    {showModal === 'ADD' ? t.addBalance : t.deductBalance}
                                </h3>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{trainer.name?.[lang]}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="glass rounded-2xl p-5 border-white/5 text-center">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{t.amount}</p>
                                    <input 
                                        type="number" 
                                        className="bg-transparent border-none text-3xl font-black text-center w-full focus:ring-0" 
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        autoFocus
                                    />
                                    <p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest italic">JOD</p>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowModal(null)}
                                        className="flex-1 py-5 rounded-2xl glass text-[10px] font-black uppercase tracking-widest text-white/40 border-white/5"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (amount && parseFloat(amount) > 0) {
                                                onUpdate(trainer.uid, parseFloat(amount), showModal);
                                                setShowModal(null);
                                                setAmount("");
                                            }
                                        }}
                                        className={`flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${showModal === 'ADD' ? 'primary-gradient text-black shadow-primary/20' : 'bg-red-500 text-white shadow-red-500/20'}`}
                                    >
                                        {t.confirm}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

