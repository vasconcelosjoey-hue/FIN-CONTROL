
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
let db: Firestore;

try {
  // Inicialização singleton do app
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // Inicialização do Firestore
  db = getFirestore(app);
  
  console.log("🚀 Firebase: Inicializado com sucesso");
} catch (error) {
  console.error("❌ Firebase: Erro de inicialização:", error);
  // db permanecerá undefined, o que deve ser tratado nos serviços
}

export { db };
