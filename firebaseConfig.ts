
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
  // Inicialização Singleton: garante que apenas uma instância do app rode no navegador
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // Vincula o Firestore à instância ativa do App
  db = getFirestore(app);
  
  console.log("🚀 Firebase: Inicializado com sucesso.");
} catch (error) {
  console.error("❌ Firebase: Erro fatal na inicialização:", error);
}

export { db };
