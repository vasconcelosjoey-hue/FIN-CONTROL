
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
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

export const resetPassword = async (email: string): Promise<void> => {
  if (!auth) return;
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};

// Retorna o timestamp da última atualização salva localmente
export const getLocalTimestamp = (userId: string): number => {
  const localDataStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  if (!localDataStr) return 0;
  try {
    const data = JSON.parse(localDataStr);
    return data.lastUpdate || 0;
  } catch {
    return 0;
  }
};

// Salva IMEDIATAMENTE no localStorage com timestamp
export const saveToLocal = (userId: string, data: FinancialData): void => {
  const dataToSave = {
    ...data,
    lastUpdate: data.lastUpdate || Date.now()
  };
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(dataToSave));
};

export const loadData = async (userId: string): Promise<FinancialData> => {
  const localDataStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  const localData = localDataStr ? JSON.parse(localDataStr) : null;

  if (db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data() as any;
        
        if (localData) {
          const localTimestamp = localData.lastUpdate || 0;
          const cloudTimestamp = cloudData.lastUpdate || 0;
          
          const countItems = (d: any) => 
            (d.incomes?.length || 0) + 
            (d.fixedExpenses?.length || 0) + 
            (d.installments?.length || 0) + 
            (d.customSections?.reduce((a: number, s: any) => a + (s.items?.length || 0), 0) || 0);

          if (localTimestamp > cloudTimestamp || (localTimestamp === cloudTimestamp && countItems(localData) > countItems(cloudData))) {
            console.log("⚡ Priorizando dados locais (mais recentes/completos)");
            await setDoc(docRef, { ...localData, lastUpdate: Date.now() });
            return localData;
          }
        }
        return cloudData as FinancialData;
      } else if (localData) {
        await setDoc(docRef, localData);
        return localData;
      }
    } catch (error) {
      console.warn("Cloud load failed, using local fallback", error);
    }
  }
  return localData || INITIAL_DATA;
};

// Salva na nuvem com timestamp
export const saveToCloud = async (userId: string, data: FinancialData): Promise<void> => {
  if (!db) return;
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdate: data.lastUpdate || Date.now()
    };
    await setDoc(doc(db, "users", userId), dataWithTimestamp);
  } catch (error) {
    console.error("Error saving to Firebase:", error);
    throw error;
  }
};

export const saveData = async (userId: string, data: FinancialData): Promise<void> => {
  const timestampedData = { ...data, lastUpdate: Date.now() };
  saveToLocal(userId, timestampedData);
  await saveToCloud(userId, timestampedData);
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
