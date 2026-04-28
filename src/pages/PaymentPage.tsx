import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, CreditCard, ShieldCheck, Lock, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { UserProfile } from "../types";
import { db } from "../lib/firebase";
import { doc, updateDoc, increment, addDoc, collection } from "firebase/firestore";
import { formatPrice } from "../lib/currency";
import { useCart } from "../context/CartContext";

declare global {
    interface Window {
        PaymentSession: any;
    }
}

export default function PaymentPage({ user, lang }: { user: UserProfile, lang: "ar" | "en" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { amount, currency, quoteId, expertId, chatId, quoteMsgId, type, orderData, testData } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: ""
  });

  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<string>('');
  const [sessionReady, setSessionReady] = useState(false);
  const [showOTPFrame, setShowOTPFrame] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<any>(null);

  const t = {
    title: lang === "ar" ? "الدفع الآمن" : "Secure Payment",
    cardNumber: lang === "ar" ? "رقم البطاقة" : "Card Number",
    cardHolder: lang === "ar" ? "اسم صاحب البطاقة" : "Cardholder Name",
    expiry: lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date",
    cvc: lang === "ar" ? "الرمز (CVC)" : "CVC",
    summary: lang === "ar" ? "ملخص العملية" : "Payment Summary",
    total: lang === "ar" ? "المجموع الكلي" : "Total Amount",
    payNow: lang === "ar" ? "ادفع الآن" : "Pay Now",
    processing: lang === "ar" ? "جاري المعالجة..." : "Processing...",
    secureInfo: lang === "ar" ? "بياناتك مشفرة ومحمية بالكامل" : "Your data is fully encrypted and protected",
    successMsg: lang === "ar" ? "تمت عملية الدفع بنجاح!" : "Payment successful!",
    back: lang === "ar" ? "العودة للدردشة" : "Back to Chat",
    redirecting: lang === "ar" ? "جاري توجيهك..." : "Redirecting you...",
    mastercard: "MASTERCARD",
    visa: "VISA",
    authTitle: lang === "ar" ? "التحقق من الهوية" : "Identity Verification",
    authSecure: lang === "ar" ? "آمن" : "SECURE",
    authTimeout: lang === "ar" ? "انتهت مهلة التحقق البنكي" : "Bank verification timed out",
    authFailed: lang === "ar" ? "فشل التحقق من الهوية. يرجى المحاولة مرة أخرى." : "Identity verification failed. Please try again.",
    authConfirmedErr: lang === "ar" ? "لم يتم تأكيد التحقق في الوقت المطلوب" : "Verification not confirmed in time",
    libError: lang === "ar" ? "خطأ في تحميل مكتبة الدفع - يرجى تحديث الصفحة" : "Payment library error - please refresh page",
    systemError: lang === "ar" ? "حدث خطأ في النظام. يرجى المحاولة مرة أخرى." : "System error. Please try again.",
    cardError: lang === "ar" ? "خطأ في بيانات البطاقة" : "Card data error"
  };

  const generateOrderId = () => `NY11-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;

  const writeToIframe = (iframeId: string, html: string) => {
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
    if (!iframe) return;
    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
    }
  };

  useEffect(() => {
    if (window.PaymentSession) {
        initializePaymentSession();
        return;
    }
    // Load Mastercard Session script
    const merchantId = import.meta.env.VITE_MASTERCARD_MERCHANT_ID;
    const existingScript = document.querySelector('script[src*="session.js"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = `https://test-gateway.mastercard.com/form/version/100/merchant/${merchantId}/session.js`;
    script.async = true;
    script.onload = () => {
        console.log('Mastercard Session JS loaded');
        initializePaymentSession();
    };
    document.head.appendChild(script);
  }, []);

  const initializePaymentSession = async (isRetry = false) => {
    const orderId = generateOrderId();
    
    try {
        if (!isRetry) {
            setLoading(true);
            setGatewayError(null);
        }
        
        const resp = await fetch('/api/payment/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency: 'JOD', orderId })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(JSON.stringify(data));

        const { sessionId } = data;

        // Wait for DOM
        setTimeout(() => {
            if (!window.PaymentSession) {
                console.error('Mastercard session.js not loaded on window');
                setGatewayError(t.libError);
                setLoading(false);
                return;
            }

            console.log('Configuring PaymentSession with session:', sessionId);
            window.PaymentSession.configure({
                session: sessionId,
                fields: {
                    card: {
                        number: "#card-number",
                        securityCode: "#security-code",
                        expiryMonth: "#expiry-month",
                        expiryYear: "#expiry-year",
                        nameOnCard: "#cardholder-name"
                    }
                },
                frameEmbeddingMitigation: ["javascript"],
                callbacks: {
                    initialized: function (response: any) {
                        console.log('PaymentSession initialized:', response);
                        setSessionReady(true);
                        setLoading(false);
                    },
                    formSessionUpdate: function (response: any) {
                        console.log('formSessionUpdate:', response);
                        if (response.status === "ok") {
                            handle3DSAndPay(orderId, sessionId, amount);
                        } else if (response.status === "fields_in_error") {
                            setLoading(false);
                            const errorFields = Object.keys(response.errors || {}).join(', ');
                            setGatewayError(`${t.cardError}: ${errorFields}`);
                        } else {
                            setLoading(false);
                            setGatewayError(t.systemError);
                        }
                    }
                },
                interaction: {
                    control: "SHIFT_TAB"
                }
            });
        }, 1000);

    } catch (err: any) {
        if (!isRetry) {
            setLoading(false);
            setGatewayError(err.message);
        }
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionReady) return;
    setLoading(true);
    setGatewayError(null);
    setPaymentStep(t.processing);
    window.PaymentSession.updateSessionFromForm('card');
  };

  const handle3DSAndPay = async (orderId: string, sid: string, amount: number) => {
    try {
        setPaymentStep(lang === 'ar' ? 'جاري التحقق الأمني (3DS)...' : 'Security Check (3DS)...');
        const authTransId = `auth-${Date.now()}`;

        const initResp = await fetch('/api/payment/initiate-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, transactionId: authTransId, sessionId: sid, currency: 'JOD' })
        });
        const initData = await initResp.json();

        const initHtml = initData.authentication?.redirect?.html;
        if (initHtml) {
            console.log('3DS Init HTML detected, writing to hidden iframe');
            writeToIframe('hidden-3ds-frame', initHtml);
            await new Promise(r => setTimeout(r, 3000));
        }

        setPaymentStep(lang === 'ar' ? 'يرجى إكمال التحقق من خلال البنك الخاص بك...' : 'Please complete bank verification...');

        const authResp = await fetch('/api/payment/authenticate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId,
                transactionId: authTransId,
                sessionId: sid,
                amount,
                currency: 'JOD',
                browserDetails: {
                    javaEnabled: navigator.javaEnabled?.() || false,
                    language: navigator.language,
                    screenHeight: screen.height,
                    screenWidth: screen.width,
                    timeZone: new Date().getTimezoneOffset(),
                    colorDepth: screen.colorDepth,
                    returnUrl: window.location.origin + '/api/payment/3ds-callback'
                }
            })
        });
        const authData = await authResp.json();

        let otpHtml = authData.authentication?.redirect?.html;

        if (!otpHtml && authData.authentication?.payerInteraction === 'NOT_REQUIRED') {
            await executePayment(orderId, sid, amount, authTransId);
            return;
        }

        if (otpHtml) {
            otpHtml = otpHtml.replace(/target=["'][^"']*["']/gi, 'target="_self"');
            if (!otpHtml.toLowerCase().includes('target=')) {
                otpHtml = otpHtml.replace(/<form/i, '<form target="_self"');
            }
        }

        setShowOTPFrame(true);
        await new Promise(r => setTimeout(r, 200));
        console.log('Writing OTP HTML to frame, length:', otpHtml?.length);
        writeToIframe('otp-3ds-frame', otpHtml || '');

        await new Promise<void>((resolve, reject) => {
            const maxWait = setTimeout(() => {
                reject(new Error(t.authTimeout));
            }, 5 * 60 * 1000);

            const messageHandler = (event: MessageEvent) => {
                if (event.data === '3ds_challenge_complete') {
                    clearTimeout(maxWait);
                    window.removeEventListener('message', messageHandler);
                    setShowOTPFrame(false);
                    resolve();
                }
            };
            window.addEventListener('message', messageHandler);
        });

        let authConfirmed = false;
        for (let attempt = 1; attempt <= 12; attempt++) {
            await new Promise(r => setTimeout(r, 2500));
            try {
                const statusResp = await fetch(`/api/payment/order-status/${orderId}`);
                const statusData = await statusResp.json();
                
                // In v100, we look at the last transaction or the authentication field
                const lastTx = statusData.transaction?.[statusData.transaction.length - 1];
                const authStatus = lastTx?.authentication?.status || statusData.authenticationStatus;
                
                if (authStatus === 'AUTHENTICATION_SUCCESSFUL' || authStatus === 'SUCCESS') {
                    authConfirmed = true;
                    break;
                } else if (['AUTHENTICATION_UNSUCCESSFUL', 'AUTHENTICATION_FAILED', 'FAILED'].includes(authStatus)) {
                    throw new Error(t.authFailed);
                }
            } catch (pollErr: any) {
                if (pollErr.message.includes('فشل') || pollErr.message.includes('failed')) throw pollErr;
            }
        }
        if (!authConfirmed) throw new Error(t.authConfirmedErr);
        
        await executePayment(orderId, sid, amount, authTransId);

    } catch (err: any) {
        setLoading(false);
        setShowOTPFrame(false);
        setGatewayError(err.message);
        initializePaymentSession(true);
    }
  };

  const executePayment = async (orderId: string, sid: string, amount: number, authTransId: string) => {
    try {
        setPaymentStep(lang === 'ar' ? 'جاري إتمام عملية الدفع...' : 'Finalizing payment...');
        const resp = await fetch('/api/payment/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, sessionId: sid, amount, currency: 'JOD', authTransactionId: authTransId })
        });
        const data = await resp.json();

        if (data.success) {
            // Save order to Firebase
            if (user) {
              const paymentData = {
                userId: user.uid,
                amount: amount,
                currency: currency || "JOD",
                type: type || "CARD_PAYMENT",
                timestamp: Date.now(),
                status: "SUCCESS",
                orderId: orderId,
                transactionId: data.transactionId
              };
              await addDoc(collection(db, "payments"), paymentData);

              if (type === "QUOTE" && chatId && expertId) {
                const expertRef = doc(db, "users", expertId);
                await updateDoc(expertRef, { walletBalance: increment(amount) });
                if (quoteMsgId) {
                  await updateDoc(doc(db, "chats", chatId, "messages", quoteMsgId), { 
                    type: "TEXT", 
                    text: lang === "ar" ? "تم قبول عرض السعر والدفع عبر البطاقة ✅" : "Quote accepted and paid via Card ✅" 
                  });
                }
              } else if (type === "ORDER" && orderData) {
                await addDoc(collection(db, "orders"), {
                  ...orderData,
                  userId: user.uid,
                  timestamp: Date.now(),
                  status: "PAID",
                  paymentMethod: "CARD",
                  orderId: orderId,
                  transactionId: data.transactionId
                });
                clearCart();
              } else if (type === "LAB_TEST" && testData) {
                await addDoc(collection(db, "orders"), {
                  userId: user.uid,
                  userName: user.name,
                  items: [{
                    id: testData.id,
                    name: testData.name,
                    price: testData.price,
                    currency: testData.currency || "JOD",
                    type: "LAB",
                    quantity: 1
                  }],
                  total: amount,
                  timestamp: Date.now(),
                  status: "PAID",
                  paymentMethod: "CARD",
                  orderId: orderId,
                  transactionId: data.transactionId
                });
              }
            }

            setSuccess(true);
            setTimeout(() => {
              if (type === "QUOTE") navigate(`/chat/${chatId}`);
              else navigate("/orders");
            }, 3000);
        } else {
            const errorMsg = data.error?.explanation || data.error?.acquirerMessage || data.gatewayCode || data.result;
            throw new Error(`${lang === 'ar' ? 'فشلت عملية الدفع' : 'Payment failed'}: ${errorMsg}`);
        }
    } catch (err: any) {
        setGatewayError(err.message);
        initializePaymentSession(true);
    } finally {
        setLoading(false);
        setPaymentStep('');
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-black"
        >
            <CheckCircle2 size={48} />
        </motion.div>
        <div className="text-center space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{t.successMsg}</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{t.processing}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-12 pb-32" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <iframe id="hidden-3ds-frame" style={{ display: 'none' }} />
      
      <AnimatePresence>
          {showOTPFrame && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
              >
                  <div className="bg-[#0d0d0d] rounded-3xl shadow-2xl overflow-hidden w-full max-w-sm border border-white/10">
                      <div className="bg-primary px-6 py-4 flex items-center justify-between">
                          <h3 className="text-black font-black text-xs uppercase tracking-wider">{t.authTitle}</h3>
                          <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                              <span className="text-white text-[8px] font-bold">{t.authSecure}</span>
                          </div>
                      </div>
                      <iframe id="otp-3ds-frame" style={{ width: '100%', height: '450px', border: 'none' }} />
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <header className="px-6 flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-white/40">
          <ChevronLeft size={20} className={lang === 'en' ? 'rotate-180' : ''} />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-black italic tracking-tighter uppercase">{t.title}</h1>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Mastercard Gateway</p>
        </div>
        <div className="w-12" />
      </header>

      <main className="px-6 space-y-8">
        {/* Visual Card Section */}
        <div className="relative h-48 w-full perspective-1000">
            <motion.div 
                className="w-full h-full primary-gradient rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden"
                whileHover={{ rotateY: 5 }}
            >
                <div className="flex justify-between items-start">
                    <div className="w-12 h-10 bg-black/20 rounded-lg flex items-center justify-center">
                        <CreditCard size={24} className="text-black/40" />
                    </div>
                    <div className="text-[10px] font-black text-black/40 italic uppercase tracking-widest">
                        {cardData.number.startsWith('4') ? t.visa : t.mastercard}
                    </div>
                </div>
                
                <div className="space-y-4">
                    <p className="text-xl font-black text-black/80 tracking-[0.2em] font-mono">
                        {cardData.number || "**** **** **** ****"}
                    </p>
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest">{t.cardHolder}</p>
                            <p className="text-xs font-black text-black/80 uppercase italic">{cardData.name || "YOUR NAME"}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[8px] font-black text-black/40 uppercase tracking-widest">{t.expiry}</p>
                            <p className="text-xs font-black text-black/80">{cardData.expiry || "**/**"}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
            <div className="space-y-4">
                <InputField 
                    id="cardholder-name"
                    label={t.cardHolder} 
                    value={cardData.name} 
                    placeholder="CARDHOLDER NAME"
                    onChange={(v: string) => setCardData({...cardData, name: v})} 
                />
                <InputField 
                    id="card-number"
                    label={t.cardNumber} 
                    value={cardData.number} 
                    placeholder="0000 0000 0000 0000"
                    onChange={(v: string) => setCardData({...cardData, number: v.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19)})} 
                />
                <div className="grid grid-cols-3 gap-4">
                    <InputField 
                        id="expiry-month"
                        label={lang === 'ar' ? 'الشهر' : 'MM'} 
                        value={cardData.expiry.split(' / ')[0] || ''} 
                        placeholder="MM"
                        onChange={() => {}} 
                    />
                    <InputField 
                        id="expiry-year"
                        label={lang === 'ar' ? 'السنة' : 'YY'} 
                        value={cardData.expiry.split(' / ')[1] || ''} 
                        placeholder="YY"
                        onChange={() => {}} 
                    />
                    <InputField 
                        id="security-code"
                        label={t.cvc} 
                        value={cardData.cvc} 
                        placeholder="123"
                        type="password"
                        onChange={(v: string) => setCardData({...cardData, cvc: v.slice(0, 3)})} 
                    />
                </div>
            </div>

            {paymentStep && (
                <div className="bg-primary/10 text-primary px-4 py-3 rounded-2xl text-[10px] font-bold flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin" />
                    {paymentStep}
                </div>
            )}

            {gatewayError && (
                <div className="bg-red-500/10 text-red-500 px-4 py-3 rounded-2xl text-[10px] font-bold flex items-center gap-3">
                    <AlertTriangle size={16} />
                    {gatewayError}
                </div>
            )}

            <div className="glass p-6 rounded-3xl space-y-3 bg-white/5 border-white/5">
                <div className="flex justify-between items-center text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    <span>{t.summary}</span>
                    <span>{t.total}</span>
                </div>
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                        <Lock size={14} className="text-primary" />
                        <span className="text-[10px] font-bold text-white/60">{t.secureInfo}</span>
                    </div>
                    <span className="text-2xl font-black text-primary italic">{formatPrice(amount, user, currency)}</span>
                </div>
            </div>

            <button 
                type="submit"
                disabled={loading || !sessionReady}
                className="w-full bg-primary text-black py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                {loading ? t.processing : t.payNow}
            </button>
        </form>
      </main>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", id }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">{label}</label>
            <div className="glass rounded-2xl px-5 border border-white/5 focus-within:border-primary/50 transition-all">
                <input 
                    id={id}
                    type={type} 
                    className="bg-transparent border-none focus:ring-0 text-sm w-full py-4 font-bold placeholder:text-white/10" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={id !== undefined}
                />
            </div>
        </div>
    );
}

