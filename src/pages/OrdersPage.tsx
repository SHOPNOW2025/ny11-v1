import React, { useEffect, useState } from "react";
import { UserProfile } from "../types";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/currency";

interface Order {
    id: string;
    items: any[];
    total: number;
    timestamp: number;
    status: "PAID" | "PENDING" | "CANCELLED" | "COMPLETED";
    userId: string;
}

export default function OrdersPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const t = {
        previousOrders: lang === "ar" ? "طلباتي السابقة" : "Previous Orders",
        purchaseHistory: lang === "ar" ? "سجل المشتريات" : "Purchase History",
        order: lang === "ar" ? "طلب" : "ORDER",
        itemsCount: lang === "ar" ? (n: number) => `${n} منتجات` : (n: number) => `${n} ITEMS`,
        noOrders: lang === "ar" ? "لا يوجد طلبات سابقة" : "No previous orders"
    };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const q = query(
                    collection(db, "orders"),
                    where("userId", "==", user.uid)
                );
                const snap = await getDocs(q);
                const ordersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                // Sort client-side to avoid composite index requirement
                ordersList.sort((a, b) => b.timestamp - a.timestamp);
                setOrders(ordersList);
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user.uid]);

    return (
        <div className="flex-1 flex flex-col pt-12 pb-32 overflow-x-hidden">
            <div className="px-6 flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-[var(--text-muted)] border-[var(--border-muted)]">
                    <ChevronLeft size={20} className={lang === 'en' ? 'rotate-180' : ''} />
                </button>
                <div className="text-center">
                    <h1 className="text-xl font-black italic tracking-tighter uppercase text-[var(--text-main)]">{t.previousOrders}</h1>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.purchaseHistory}</p>
                </div>
                <div className="w-12" />
            </div>

            <main className="px-6 space-y-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-32 glass rounded-3xl animate-pulse" />)
                ) : orders.length > 0 ? (
                    orders.map((order, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={order.id}
                            className="glass rounded-[2.5rem] p-6 border-[var(--border-muted)] space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Clock size={12} className="text-primary" />
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                                            {new Date(order.timestamp).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <h3 className="text-sm font-black tracking-tight text-[var(--text-main)] uppercase">{t.order} #{order.id.slice(-6)}</h3>
                                </div>
                                <StatusBadge status={order.status} lang={lang} />
                            </div>

                            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                                {order.items.map((item: any, i: number) => (
                                    <div key={i} className="w-14 h-14 glass rounded-xl overflow-hidden shrink-0">
                                        <img src={item.image || `https://ui-avatars.com/api/?name=${item.name || 'Item'}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-[var(--border-muted)] flex justify-between items-center">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{t.itemsCount(order.items.length)}</p>
                                <p className="text-lg font-black text-[var(--text-main)] tracking-tighter">{formatPrice(order.total, user)}</p>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-20 text-[var(--text-muted)] bg-white/5 rounded-[3rem] border border-dashed border-[var(--border-muted)]">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest italic">{t.noOrders}</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function StatusBadge({ status, lang }: { status: string, lang: string }) {
    const configs: any = {
        PAID: { label: lang === "ar" ? "تم الدفع" : "PAID", icon: <CheckCircle2 size={12} />, color: "bg-primary/10 text-primary" },
        COMPLETED: { label: lang === "ar" ? "مكتمل" : "COMPLETED", icon: <CheckCircle2 size={12} />, color: "bg-blue-500/10 text-blue-400" },
        PENDING: { label: lang === "ar" ? "قيد الانتظار" : "PENDING", icon: <Clock size={12} />, color: "bg-amber-500/10 text-amber-400" },
        CANCELLED: { label: lang === "ar" ? "ملغي" : "CANCELLED", icon: <XCircle size={12} />, color: "bg-red-500/10 text-red-500" }
    };
    const config = configs[status] || configs.PENDING;
    return (
        <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${config.color}`}>
            {config.icon}
            <span className="text-[9px] font-black uppercase tracking-widest">{config.label}</span>
        </div>
    );
}
