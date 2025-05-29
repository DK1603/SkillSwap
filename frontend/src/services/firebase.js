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
  doc,
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBsrHV--l-LFHls3HMjy7XQMmxKg04MCc0",
    authDomain: "skillswap-e10d6.firebaseapp.com",
    projectId: "skillswap-e10d6",
    storageBucket: "skillswap-e10d6.firebasestorage.app",
    messagingSenderId: "607068548148",
    appId: "1:607068548148:web:c5939bcbb0055a2b402e61",
    measurementId: "G-SV8BZEC5RX"
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
const usersCol = collection(db, 'users');

export function fetchLessons() {
  return getDocs(lessonsCol);
}

export function onLessonsSnapshot(cb) {
  return onSnapshot(lessonsCol, cb);
}

export function createLesson(data) {
  return addDoc(lessonsCol, data);
}

export function fetchUsers() {
  return getDocs(usersCol);
}

export function fetchUserTeaching(uid) {
  const userDocRef = doc(db, 'users', uid);
  const teachingColRef = collection(userDocRef, "teaching");
  return getDocs(teachingColRef);
}
