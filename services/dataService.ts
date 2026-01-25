
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FinancialData, INITIAL_DATA } from "../types";

const LOCAL_STORAGE_KEY = "fincontroller_data";

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
          
          if (localTimestamp > cloudTimestamp) {
            console.log("⚡ Priorizando dados locais (mais recentes)");
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
