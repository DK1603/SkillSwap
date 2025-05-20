import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged        // ← import this
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "[REDACTED_API_KEY]",
    authDomain: "[REDACTED_DOMAIN]",
    projectId: "[REDACTED_PROJECT_ID]",
    storageBucket: "[REDACTED_PROJECT_ID].firebasestorage.app",
    messagingSenderId: "[REDACTED_SENDER_ID]",
    appId: "1:[REDACTED_SENDER_ID]:web:c5939bcbb0055a2b402e61",
    measurementId: "[REDACTED_MEASUREMENT_ID]"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth helpers
export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

// **Add this** — wrap Firebase’s onAuthStateChanged:
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Firestore helpers
const lessonsCol = collection(db, 'lessons');

export function fetchLessons() {
  return getDocs(lessonsCol);
}

export function onLessonsSnapshot(cb) {
  return onSnapshot(lessonsCol, cb);
}

export function createLesson(data) {
  return addDoc(lessonsCol, data);
}
