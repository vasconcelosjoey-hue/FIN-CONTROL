
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCc8RhjBVreMRa73AaywBMtDeYCqqssFao",
  authDomain: "financial-controller-joia.firebaseapp.com",
  projectId: "financial-controller-joia",
  storageBucket: "financial-controller-joia.firebasestorage.app",
  messagingSenderId: "406969627066",
  appId: "1:406969627066:web:684ac27225416cc6fb6d83"
};

// Singleton para o Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicialização do Firestore
export const db = getFirestore(app);

// Inicialização do Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
