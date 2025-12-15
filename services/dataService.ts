import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { signInAnonymously, User } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { FinancialData, INITIAL_DATA } from "../types";

const LOCAL_STORAGE_KEY = "fincontrole_data";

export const signInUser = async (): Promise<User | null> => {
  if (auth) {
    try {
      const userCredential = await signInAnonymously(auth);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      return null;
    }
  }
  return null;
};

export const loadData = async (userId: string): Promise<FinancialData> => {
  if (db) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as FinancialData;
      } else {
        // Create initial document if it doesn't exist
        await setDoc(docRef, INITIAL_DATA);
        return INITIAL_DATA;
      }
    } catch (error) {
      console.warn("Error loading from Firebase, falling back to local mock.", error);
    }
  }

  // Fallback to LocalStorage
  const local = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
  return local ? JSON.parse(local) : INITIAL_DATA;
};

export const saveData = async (userId: string, data: FinancialData): Promise<void> => {
  // Always save to local storage as backup/cache
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
    const unsub = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as FinancialData);
      }
    });
    return unsub;
  }
  return () => {}; // No-op unsubscribe for local storage
};