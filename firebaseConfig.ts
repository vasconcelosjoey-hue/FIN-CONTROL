
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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

// Inicialização do Firestore vinculada ao app
export const db = getFirestore(app);
