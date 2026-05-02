import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

try {
  const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyDummyKeyDummyKeyDummyKey",
    authDomain: "ny11-d38d1.firebaseapp.com",
    projectId: "ny11-d38d1",
    storageBucket: "ny11-d38d1.firebasestorage.app",
    messagingSenderId: "1067554930031",
    appId: "1:1067554930031:web:da49460b3c1ef838a0fc9a",
    measurementId: "G-LJ4XL03QKF"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  console.log("Success with dummy key");
} catch (e) {
  console.error("ERROR", e);
}
