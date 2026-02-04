
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FinancialData, INITIAL_DATA } from "../types";

const LOCAL_STORAGE_KEY = "fincontroller_data";

/**
 * Valida a estrutura dos dados antes de salvar na nuvem ou localmente.
 * Previne que usuários injetem scripts ou estruturas corrompidas via Console.
 */
const validateFinancialData = (data: any): FinancialData => {
  const clean = { ...INITIAL_DATA };
  
  if (!data || typeof data !== 'object') return clean;

  // Garante que arrays essenciais existam
  clean.customSections = Array.isArray(data.customSections) ? data.customSections : clean.customSections;
  clean.goals = Array.isArray(data.goals) ? data.goals : clean.goals;
  clean.dreams = Array.isArray(data.dreams) ? data.dreams : clean.dreams;
  clean.creditCards = Array.isArray(data.creditCards) ? data.creditCards : clean.creditCards;
  clean.pixKeys = Array.isArray(data.pixKeys) ? data.pixKeys : clean.pixKeys;
  clean.radarItems = Array.isArray(data.radarItems) ? data.radarItems : clean.radarItems;
  
  clean.dreamsTotalBudget = typeof data.dreamsTotalBudget === 'number' ? data.dreamsTotalBudget : 0;
  clean.lastUpdate = typeof data.lastUpdate === 'number' ? data.lastUpdate : Date.now();
  clean.sectionsOrder = Array.isArray(data.sectionsOrder) ? data.sectionsOrder : clean.sectionsOrder;

  return clean;
};

export const saveToLocal = (userId: string, data: FinancialData): void => {
  const validated = validateFinancialData(data);
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(validated));
};

export const loadData = async (userId: string): Promise<FinancialData> => {
  const localDataStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  const localData = localDataStr ? JSON.parse(localDataStr) : null;

  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = validateFinancialData(docSnap.data());
      const cloudTimestamp = cloudData.lastUpdate || 0;
      const localTimestamp = localData?.lastUpdate || 0;

      if (cloudTimestamp >= localTimestamp) {
        saveToLocal(userId, cloudData);
        return cloudData;
      } else {
        const validatedLocal = validateFinancialData(localData);
        await setDoc(docRef, { ...validatedLocal, lastUpdate: Date.now() });
        return validatedLocal;
      }
    } else if (localData) {
      const validatedLocal = validateFinancialData(localData);
      await setDoc(docRef, validatedLocal);
      return validatedLocal;
    }
  } catch (error: any) {
    console.error("⚠️ Erro crítico de segurança/acesso:", error.message);
  }

  return validateFinancialData(localData) || INITIAL_DATA;
};

export const saveToCloud = async (userId: string, data: FinancialData): Promise<void> => {
  try {
    const validatedData = validateFinancialData(data);
    const dataWithTimestamp = {
      ...validatedData,
      lastUpdate: Date.now()
    };
    await setDoc(doc(db, "users", userId), dataWithTimestamp);
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      alert("ERRO DE SEGURANÇA: Tentativa de gravação não autorizada detectada.");
    }
    throw error;
  }
};

export const subscribeToData = (userId: string, callback: (data: FinancialData) => void) => {
  return onSnapshot(
    doc(db, "users", userId), 
    (doc) => {
      if (doc.exists()) {
        const cloudData = validateFinancialData(doc.data());
        saveToLocal(userId, cloudData);
        callback(cloudData);
      }
    }
  );
};
