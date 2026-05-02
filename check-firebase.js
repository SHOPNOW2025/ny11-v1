import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

try {
  const app = initializeApp({ apiKey: undefined });
  const auth = getAuth(app);
  console.log("Firebase initialized successfully without apiKey!");
} catch (e) {
  console.log("Firebase threw error:", e.message);
}
