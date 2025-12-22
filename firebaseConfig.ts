
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

/**
 * CONFIGURAÇÃO PROFISSIONAL
 * Valores atualizados com as credenciais do seu projeto 'financial-controller-joia'
 */
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
let auth: Auth;

// Inicialização segura para ambientes React (evita re-inicialização em Hot Reload)
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  
  console.log("🚀 Cloud Sync: Ativo no projeto " + firebaseConfig.projectId);
} catch (error) {
  console.error("❌ Falha na conexão Cloud:", error);
}

export { db, auth };
