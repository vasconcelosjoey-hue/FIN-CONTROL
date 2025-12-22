
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User 
} from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { FinancialData, INITIAL_DATA } from "../types";

const LOCAL_STORAGE_KEY = "fincontroller_data";

export const registerUser = async (email: string, pass: string): Promise<User | null> => {
  if (!auth) return null;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
  if (!auth) return null;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

export const loadData = async (userId: string): Promise<FinancialData> => {
  // 1. Tenta carregar o que está salvo no navegador (backup local)
  const localDataStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  const localData = localDataStr ? JSON.parse(localDataStr) : null;

  if (db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Se existe na nuvem, ela é a soberana
        const cloudData = docSnap.data() as FinancialData;
        
        // Pequena verificação: se a nuvem estiver "vazia" mas o local tiver dados, 
        // pode ser um erro de sincronia inicial. Vamos fundir se necessário.
        if (cloudData.incomes.length === 0 && cloudData.fixedExpenses.length === 0 && localData) {
            await setDoc(docRef, localData);
            return localData;
        }
        
        return cloudData;
      } else {
        // Se NÃO existe na nuvem ainda, vamos ver se temos algo local para migrar
        if (localData) {
          console.log("🚚 Migrando dados locais para a nuvem...");
          await setDoc(docRef, localData);
          return localData;
        } else {
          // Se não tem em lugar nenhum, cria o inicial
          await setDoc(docRef, INITIAL_DATA);
          return INITIAL_DATA;
        }
      }
    } catch (error) {
      console.warn("Cloud load failed, using local fallback", error);
    }
  }
  
  return localData || INITIAL_DATA;
};

export const saveData = async (userId: string, data: FinancialData): Promise<void> => {
  // Salva sempre no local primeiro (velocidade)
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  
  // Tenta subir para a nuvem
  if (db) {
    try {
      await setDoc(doc(db, "users", userId), data);
    } catch (error) {
      console.error("Error saving to Firebase:", error);
    }
  }
};

export const subscribeToData = (userId: string, callback: (data: FinancialData) => void) => {
  if (db) {
    return onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as FinancialData);
      }
    });
  }
  return () => {};
};
