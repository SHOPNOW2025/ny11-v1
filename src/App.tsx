import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { UserProfile } from "./types";

// Pages
import HomePage from "./pages/HomePage";
import MenuPage from "./pages/MenuPage";
import LabPage from "./pages/LabPage";
import ClinicPage from "./pages/ClinicPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import LabManagerDashboard from "./pages/LabManagerDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import PaymentPage from "./pages/PaymentPage";
import PlanPage from "./pages/PlanPage";
import MenuItemPage from "./pages/MenuItemPage";
import LabTestPage from "./pages/LabTestPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import SettingsPage from "./pages/SettingsPage";
import InboxPage from "./pages/InboxPage";
import AccountantDashboard from "./pages/AccountantDashboard";
import QrPage from "./pages/QrPage";

// Components
import BottomNav from "./components/BottomNav";
import AIChatButton from "./components/AIChatButton";
import LanguageToggle from "./components/LanguageToggle";
import { CartProvider } from "./context/CartContext";
import CartIcon from "./components/CartIcon";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const isQrPage = window.location.pathname === "/QrCode";

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "ar" | "en" | null;
    if (savedLang) setLang(savedLang);
  }, []);

  const toggleLang = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    if (user) {
      setDoc(doc(db, "users", user.uid), { language: newLang }, { merge: true });
    }
  };

  useEffect(() => {
    if (user?.language) {
      setLang(user.language);
      localStorage.setItem("lang", user.language);
    }
  }, [user]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDark]);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (unsubProfile) unsubProfile();
        unsubProfile = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            setUser({ uid: firebaseUser.uid, ...snap.data() } as UserProfile);
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        if (unsubProfile) unsubProfile();
        setUser(null);
        setLoading(false);
      }
    });
    
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <CartProvider>
      <Router>
        <Routes>
          <Route path="/QrCode" element={<QrPage lang={lang} />} />
          <Route path="/*" element={
            <div className="min-h-screen font-sans selection:bg-primary/30 text-[var(--text-main)]" dir={lang === "ar" ? "rtl" : "ltr"}>
              <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto relative min-h-screen flex flex-col shadow-2xl bg-[var(--bg-main)] transition-all border-x border-[var(--border-muted)]">
                <LanguageToggle lang={lang} toggle={toggleLang} />
                <AIChatButton user={user} />
                <CartIcon />
                <Routes>
                  <Route path="/" element={<HomePage user={user} lang={lang} />} />
                  <Route path="/menu" element={<MenuPage user={user} lang={lang} />} />
                  <Route path="/menu/:id" element={<MenuItemPage user={user} lang={lang} />} />
                  <Route path="/lab" element={<LabPage user={user} lang={lang} />} />
                  <Route path="/lab/:id" element={<LabTestPage user={user} lang={lang} />} />
                  <Route path="/cart" element={<CartPage user={user} lang={lang} />} />
                  <Route path="/inbox" element={user ? <InboxPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/orders" element={user ? <OrdersPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/payment" element={user ? <PaymentPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/payment-methods" element={user ? <PaymentMethodsPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/settings" element={user ? <SettingsPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/auth" element={<AuthPage lang={lang} />} />
                  
                  <Route path="/clinic" element={user ? <ClinicPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/plan" element={user ? <PlanPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/chat/:id" element={user ? <ChatPage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  <Route path="/profile/:uid?" element={user ? <ProfilePage user={user} lang={lang} /> : <Navigate to="/auth" />} />
                  
                  {/* Role Specific Protected Routes */}
                  {user?.role === "ADMIN" && (
                    <Route path="/admin" element={<AdminDashboard user={user} lang={lang} />} />
                  )}
                  {user?.role === "LAB_MANAGER" && (
                    <Route path="/lab-manager" element={<LabManagerDashboard user={user} lang={lang} />} />
                  )}
                  {user?.role === "TRAINER" && (
                    <Route path="/trainer" element={<TrainerDashboard user={user} lang={lang} />} />
                  )}
                  {user?.role === "ACCOUNTANT" && (
                    <Route path="/accountant" element={<AccountantDashboard user={user} lang={lang} />} />
                  )}
                  
                  <Route path="/*" element={<Navigate to="/" />} />
                </Routes>
                <BottomNav user={user} role={user?.role || "USER"} lang={lang} />
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </CartProvider>
  );
}
