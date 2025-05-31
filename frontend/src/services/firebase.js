// src/services/firebase.js

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';

import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';

// ─── 1. Your Firebase config ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "[REDACTED_API_KEY]",
  authDomain: "[REDACTED_DOMAIN]",
  projectId: "[REDACTED_PROJECT_ID]",
  storageBucket: "[REDACTED_PROJECT_ID].firebasestorage.app",
  messagingSenderId: "[REDACTED_SENDER_ID]",
  appId: "1:[REDACTED_SENDER_ID]:web:c5939bcbb0055a2b402e61",
  measurementId: "[REDACTED_MEASUREMENT_ID]"
};

// ─── 2. Initialize Firebase App, Auth, and Firestore ───────────────────────────
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── 3. Auth Helpers ────────────────────────────────────────────────────────────
// (a) Sign in with email/password:
export function loginWithEmail(email, pass) {
  return signInWithEmailAndPassword(auth, email, pass);
}

// (b) Sign out:
export function logout() {
  return signOut(auth);
}

// (c) Listen for auth‐state changes:
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// (d) Sign up a new user (create Auth account + create Firestore user doc):
export async function signUpWithEmail(email, pass, displayName) {
  // 1) Create the new Auth user:
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = cred.user.uid;

  // 2) Write a new document under /users/{uid}:
  //    Give them a default pointBalance of 100 (or whatever).
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, {
    displayName,
    photoURL: '',        // user can fill in later
    email: cred.user.email,
    pointBalance: 100,   // initial points
    createdAt: serverTimestamp()
  });

  return cred; // return the Auth credential
}

// ─── 4. Firestore: “lessons” Collection ─────────────────────────────────────────
// (unchanged from before)
const lessonsCol = collection(db, 'lessons');

export function fetchLessons() {
  return getDocs(lessonsCol);
}

export function onLessonsSnapshot(cb) {
  return onSnapshot(lessonsCol, cb);
}

export function createLesson(data) {
  return addDoc(lessonsCol, {
    ...data,
    createdAt: serverTimestamp()
  });
}

export function fetchLessonsOnce() {
  const q = query(lessonsCol, orderBy('createdAt', 'desc'));
  return getDocs(q);
}

export function watchLessons(cb) {
  const q = query(lessonsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, cb);
}

// ─── 5. Firestore: “users” Collection ────────────────────────────────────────────
const usersCol = collection(db, 'users');

export function fetchUsers() {
  return getDocs(usersCol);
}

export function fetchUserTeaching(uid) {
  const userDocRef = doc(db, 'users', uid);
  const teachingColRef = collection(userDocRef, 'teaching');
  return getDocs(teachingColRef);
}

// ─── 6. Firestore: Enrollments Under Each Lesson ─────────────────────────────────
export function enroll(lessonId, uid) {
  const enrollmentDocRef = doc(db, 'lessons', lessonId, 'enrollments', uid);
  return setDoc(enrollmentDocRef, { enrolledAt: serverTimestamp() });
}

export function cancelEnrollment(lessonId, uid) {
  const enrollmentDocRef = doc(db, 'lessons', lessonId, 'enrollments', uid);
  return deleteDoc(enrollmentDocRef);
}

// ─── 7. Firestore: Profile Shortcuts ─────────────────────────────────────────────
export function watchTeaching(uid, cb) {
  const teachingCol = collection(db, 'users', uid, 'teaching');
  return onSnapshot(teachingCol, cb);
}

export function watchEnrolled(uid, cb) {
  const enrolledCol = collection(db, 'users', uid, 'enrolled');
  return onSnapshot(enrolledCol, cb);
}

export function addTeachingShortcut(uid, lessonId) {
  const teachingDocRef = doc(db, 'users', uid, 'teaching', lessonId);
  return setDoc(teachingDocRef, { linkedAt: serverTimestamp() });
}

export function addEnrolledShortcut(uid, lessonId) {
  const enrolledDocRef = doc(db, 'users', uid, 'enrolled', lessonId);
  return setDoc(enrolledDocRef, { linkedAt: serverTimestamp() });
}

// ─── 8. Firestore: Chats Collection ──────────────────────────────────────────────
export async function startChat(meUid, youUid) {
  const chatRef = await addDoc(collection(db, 'chats'), {
    members: [meUid, youUid],
    createdAt: serverTimestamp()
  });
  return chatRef.id;
}

export function sendMessage(chatId, authorUid, text) {
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  return addDoc(messagesCol, {
    authorUid,
    text,
    sentAt: serverTimestamp()
  });
}

export function watchMessages(chatId, cb) {
  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('sentAt')
  );
  return onSnapshot(messagesQuery, cb);
}
