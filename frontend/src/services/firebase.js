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
  addDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
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
export const db   = getFirestore(app);

// Auth
export const loginWithEmail = (email, pass) =>
  signInWithEmailAndPassword(auth, email, pass);

export const logout = () => signOut(auth);

export const onAuthChange = cb =>
  onAuthStateChanged(auth, cb);

// Lessons
const lessonsCol = collection(db, 'lessons');
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
