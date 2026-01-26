
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCc8RhjBVreMRa73AaywBMtDeYCqqssFao",
  authDomain: "financial-controller-joia.firebaseapp.com",
  projectId: "financial-controller-joia",
  storageBucket: "financial-controller-joia.firebasestorage.app",
  messagingSenderId: "406969627066",
  appId: "1:406969627066:web:684ac27225416cc6fb6d83"
};

let app: FirebaseApp;
let db: Firestore | null = null;

try {
  // Use existing app if already initialized to prevent duplicate initialization errors
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // Initialize Firestore with the app instance
  db = getFirestore(app);
  
  console.log("🚀 Firebase: Cloud services initialized successfully");
} catch (error) {
  console.error("❌ Firebase: Initialization error:", error);
}

export { db };
