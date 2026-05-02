import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyDummyKeyDummyKeyDummyKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ny11-d38d1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ny11-d38d1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ny11-d38d1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1067554930031",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1067554930031:web:da49460b3c1ef838a0fc9a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LJ4XL03QKF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
