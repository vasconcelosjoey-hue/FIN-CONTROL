
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
  if (db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as FinancialData;
      } else {
        await setDoc(docRef, INITIAL_DATA);
        return INITIAL_DATA;
      }
    } catch (error) {
      console.warn("Error loading from Firebase", error);
    }
  }
  const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  return local ? JSON.parse(local) : INITIAL_DATA;
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
