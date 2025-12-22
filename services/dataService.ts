
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

export const loadData = async (userId: string): Promise<FinancialData> => {
  const localDataStr = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  const localData = localDataStr ? JSON.parse(localDataStr) : null;

  if (db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data() as FinancialData;
        if (cloudData.incomes.length === 0 && cloudData.fixedExpenses.length === 0 && localData) {
            await setDoc(docRef, localData);
            return localData;
        }
        return cloudData;
      } else {
        if (localData) {
          await setDoc(docRef, localData);
          return localData;
        } else {
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
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(data));
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
