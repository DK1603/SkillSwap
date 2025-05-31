// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
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
export const db   = getFirestore(app);

// Auth
export const loginWithEmail = (email, pass) =>
  signInWithEmailAndPassword(auth, email, pass);

export const logout = () => signOut(auth);

export const onAuthChange = cb =>
  onAuthStateChanged(auth, cb);

// Lessons
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
export const createLesson = data =>
  addDoc(lessonsCol, { ...data, createdAt: serverTimestamp() });
export const fetchLessonsOnce = () =>
  getDocs(query(lessonsCol, orderBy('createdAt','desc')));
export const watchLessons = cb =>
  onSnapshot(query(lessonsCol, orderBy('createdAt','desc')), cb);

// Enrollments (under each lesson)
export const enroll = (lessonId, uid) =>
  setDoc(doc(lessonsCol, lessonId, 'enrollments', uid), {
    enrolledAt: serverTimestamp()
  });
export const cancelEnrollment = (lessonId, uid) =>
  deleteDoc(doc(lessonsCol, lessonId, 'enrollments', uid));

// Profile shortcuts
export const watchTeaching = (uid, cb) =>
  onSnapshot(collection(db, 'users', uid, 'teaching'), cb);
export const watchEnrolled = (uid, cb) =>
  onSnapshot(collection(db, 'users', uid, 'enrolled'), cb);
export const addTeachingShortcut = (uid, lessonId) =>
  setDoc(doc(db, 'users', uid, 'teaching', lessonId), { linkedAt: serverTimestamp() });
export const addEnrolledShortcut = (uid, lessonId) =>
  setDoc(doc(db, 'users', uid, 'enrolled', lessonId), { linkedAt: serverTimestamp() });

// Chats (one-on-one)
export const startChat = async (me, you) => {
  // for demo: always create a new chat
  const ref = await addDoc(collection(db, 'chats'), {
    members: [me, you],
    createdAt: serverTimestamp()
  });
  return ref.id;
};
export const sendMessage = (chatId, authorUid, text) =>
  addDoc(collection(db, 'chats', chatId, 'messages'), {
    authorUid, text, sentAt: serverTimestamp()
  });
export const watchMessages = (chatId, cb) =>
  onSnapshot(query(collection(db, 'chats', chatId, 'messages'), orderBy('sentAt')), cb);
