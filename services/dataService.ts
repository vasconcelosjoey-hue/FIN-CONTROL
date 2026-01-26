
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FinancialData, INITIAL_DATA } from "../types";

const LOCAL_STORAGE_KEY = "fincontroller_data";

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

  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data() as FinancialData;
      const cloudTimestamp = cloudData.lastUpdate || 0;
      const localTimestamp = localData?.lastUpdate || 0;

      // Se a nuvem for estritamente mais nova ou igual, atualiza o local
      if (cloudTimestamp >= localTimestamp) {
        console.log("☁️ Sync: Versão da nuvem é a mais recente.");
        saveToLocal(userId, cloudData);
        return cloudData;
      } else {
        // Se o local for mais novo, atualiza a nuvem
        console.log("⚡ Sync: Enviando dados locais para a nuvem.");
        await setDoc(docRef, { ...localData, lastUpdate: Date.now() });
        return localData;
      }
    } else if (localData) {
      // Primeira vez na nuvem
      await setDoc(docRef, localData);
      return localData;
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.error("🚫 Erro: Sem permissão no Firestore. Verifique as 'Rules' no console.");
    } else {
      console.error("⚠️ Erro ao carregar dados:", error);
    }
  }

  return localData || INITIAL_DATA;
};

export const saveToCloud = async (userId: string, data: FinancialData): Promise<void> => {
  try {
    const dataWithTimestamp = {
      ...data,
      lastUpdate: Date.now()
    };
    await setDoc(doc(db, "users", userId), dataWithTimestamp);
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.error("🚫 Erro ao salvar: Permissão negada no Firestore.");
    }
    throw error;
  }
};

export const subscribeToData = (userId: string, callback: (data: FinancialData) => void) => {
  return onSnapshot(
    doc(db, "users", userId), 
    (doc) => {
      if (doc.exists()) {
        const cloudData = doc.data() as FinancialData;
        saveToLocal(userId, cloudData);
        callback(cloudData);
      }
    },
    (error) => {
      if (error.code === 'permission-denied') {
        console.warn("🔒 Sincronização em tempo real bloqueada por falta de permissão (Rules).");
      } else {
        console.error("❌ Erro na subscrição do Firestore:", error);
      }
    }
  );
};
