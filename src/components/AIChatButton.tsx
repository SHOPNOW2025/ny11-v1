import React from "react";
import { Brain } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile, ChatRoom } from "../types";

export default function AIChatButton({ user }: { user: UserProfile | null }) {
  const navigate = useNavigate();

  const startChat = async () => {
    if (!user) {
        navigate("/auth");
        return;
    }

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef, 
      where("participants", "array-contains", user.uid),
      where("type", "==", "AI")
    );
    const snap = await getDocs(q);
    
    let chatRoom = snap.docs[0];

    if (!chatRoom) {
      const newRoom = await addDoc(collection(db, "chats"), {
        participants: [user.uid],
        expertId: null,
        type: "AI",
        updatedAt: Date.now(),
        lastMessage: "بدأت الدردشة الآن"
      });
      navigate(`/chat/${newRoom.id}`);
    } else {
      navigate(`/chat/${chatRoom.id}`);
    }
  };

  return (
    <motion.div 
      drag 
      dragElastic={0.1}
      className="fixed bottom-24 left-6 z-[100] cursor-grab active:cursor-grabbing"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
           boxShadow: [
             "0 0 0 0px rgba(139, 198, 63, 0.4)",
             "0 0 0 15px rgba(139, 198, 63, 0)",
           ],
        }}
        transition={{
           boxShadow: {
             duration: 2,
             repeat: Infinity,
             ease: "easeOut"
           }
        }}
        onClick={startChat}
        className="w-14 h-14 primary-gradient rounded-2xl flex items-center justify-center text-background-dark shadow-2xl shadow-primary/40 group overflow-hidden relative"
      >
        <Brain size={24} className="relative z-10 group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
      </motion.button>
    </motion.div>
  );
}
