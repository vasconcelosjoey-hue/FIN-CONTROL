
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FinancialData, INITIAL_DATA } from "../types";

const LOCAL_STORAGE_KEY = "fincontroller_data";

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
        const cloudData = docSnap.data() as FinancialData;
        const cloudTimestamp = cloudData.lastUpdate || 0;
        const localTimestamp = localData?.lastUpdate || 0;

        // Se o dado local for estritamente mais novo que o da nuvem, atualiza a nuvem
        if (localData && localTimestamp > cloudTimestamp) {
          console.log("⚡ Sync: Dados locais são mais novos. Enviando para nuvem.");
          await setDoc(docRef, { ...localData, lastUpdate: Date.now() });
          return localData;
        }

        // Caso contrário, usa o dado da nuvem (mais comum ao trocar de dispositivo)
        console.log("☁️ Sync: Dados da nuvem carregados.");
        saveToLocal(userId, cloudData); // Sincroniza o cache local com a nuvem
        return cloudData;
      } else if (localData) {
        // Se não existir na nuvem mas existir local, faz o primeiro upload
        console.log("📤 Sync: Primeiro upload para a nuvem.");
        await setDoc(docRef, localData);
        return localData;
      }
    } catch (error) {
      console.error("⚠️ Firebase Sync Error:", error);
    }
  }

  return localData || INITIAL_DATA;
};

export const saveToCloud = async (userId: string, data: FinancialData): Promise<void> => {
  if (!db) {
    console.warn("☁️ SaveToCloud: Firestore não disponível.");
    return;
  }
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdate: data.lastUpdate || Date.now()
    };
    await setDoc(doc(db, "users", userId), dataWithTimestamp);
  } catch (error) {
    console.error("❌ Firebase: Erro ao salvar na nuvem:", error);
    throw error;
  }
};

export const subscribeToData = (userId: string, callback: (data: FinancialData) => void) => {
  if (!db) return () => {};
  try {
    return onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        const cloudData = doc.data() as FinancialData;
        callback(cloudData);
      }
    });
  } catch (e) {
    console.error("❌ Firebase: Erro na subscrição em tempo real:", e);
    return () => {};
  }
};
