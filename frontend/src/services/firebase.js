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

// ─── 4. Firestore: “lessons” Collection ─────────────────────────────────────────
// We’ll keep a reference to the top‐level “lessons” collection:
const lessonsCol = collection(db, 'lessons');

// 4.1. Fetch all lessons once (Promise):
export function fetchLessons() {
  return getDocs(lessonsCol);
}

// 4.2. Listen to realtime lesson changes:
export function onLessonsSnapshot(cb) {
  return onSnapshot(lessonsCol, cb);
}

// 4.3. Create a new lesson document (auto‐ID) with a timestamp:
export function createLesson(data) {
  return addDoc(lessonsCol, {
    ...data,
    createdAt: serverTimestamp()
  });
}

// 4.4. Fetch lessons ordered by newest first (Promise):
export function fetchLessonsOnce() {
  const q = query(lessonsCol, orderBy('createdAt', 'desc'));
  return getDocs(q);
}

// 4.5. Watch lessons in descending order (realtime):
export function watchLessons(cb) {
  const q = query(lessonsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, cb);
}

// ─── 5. Firestore: “users” Collection ────────────────────────────────────────────
// We’ll keep a reference to the “users” collection, for profile/shortcuts:
const usersCol = collection(db, 'users');

// 5.1. Fetch all users once (Promise):
export function fetchUsers() {
  return getDocs(usersCol);
}

// 5.2. Fetch a specific user’s “teaching” sub‐collection (Promise):
export function fetchUserTeaching(uid) {
  // docRef = /users/{uid}
  const userDocRef = doc(db, 'users', uid);
  // teachingColRef = /users/{uid}/teaching
  const teachingColRef = collection(userDocRef, "teaching");
  return getDocs(teachingColRef);
}

// ─── 6. Firestore: Enrollments Under Each Lesson ─────────────────────────────────
// 6.1. Enroll current user (uid) in lesson (lessonId):
export function enroll(lessonId, uid) {
  // Path: /lessons/{lessonId}/enrollments/{uid}
  const enrollmentDocRef = doc(db, 'lessons', lessonId, 'enrollments', uid);
  return setDoc(enrollmentDocRef, {
    enrolledAt: serverTimestamp()
  });
}

// 6.2. Cancel (delete) own enrollment:
export function cancelEnrollment(lessonId, uid) {
  const enrollmentDocRef = doc(db, 'lessons', lessonId, 'enrollments', uid);
  return deleteDoc(enrollmentDocRef);
}

// ─── 7. Firestore: Profile Shortcuts ─────────────────────────────────────────────
// These “shortcut” collections let us show each user’s teaching/enrolled lessons quickly:

// 7.1. Listen to “teaching” shortcuts under /users/{uid}/teaching:
export function watchTeaching(uid, cb) {
  const teachingCol = collection(db, 'users', uid, 'teaching');
  return onSnapshot(teachingCol, cb);
}

// 7.2. Listen to “enrolled” shortcuts under /users/{uid}/enrolled:
export function watchEnrolled(uid, cb) {
  const enrolledCol = collection(db, 'users', uid, 'enrolled');
  return onSnapshot(enrolledCol, cb);
}

// 7.3. Create a “teaching” shortcut (i.e. mark that user is teacher of lessonId):
export function addTeachingShortcut(uid, lessonId) {
  const teachingDocRef = doc(db, 'users', uid, 'teaching', lessonId);
  return setDoc(teachingDocRef, { 
    linkedAt: serverTimestamp() 
  });
}

// 7.4. Create an “enrolled” shortcut (i.e. mark that user joined lessonId):
export function addEnrolledShortcut(uid, lessonId) {
  const enrolledDocRef = doc(db, 'users', uid, 'enrolled', lessonId);
  return setDoc(enrolledDocRef, { 
    linkedAt: serverTimestamp() 
  });
}

// ─── 8. Firestore: Chats Collection ──────────────────────────────────────────────
// We’ll store one “chat” document per conversation, and a “messages” sub‐collection for actual text:

// 8.1. Start a new one‐on‐one chat (always creates a fresh chat for demo):
export async function startChat(meUid, youUid) {
  // Add a doc to /chats with members array and timestamp
  const chatRef = await addDoc(collection(db, 'chats'), {
    members: [meUid, youUid],
    createdAt: serverTimestamp()
  });
  return chatRef.id; // returns the new chatId
}

// 8.2. Send a message into /chats/{chatId}/messages:
export function sendMessage(chatId, authorUid, text) {
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  return addDoc(messagesCol, {
    authorUid,
    text,
    sentAt: serverTimestamp()
  });
}

// 8.3. Listen for realtime messages in a chat, ordered by send time:
export function watchMessages(chatId, cb) {
  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('sentAt')
  );
  return onSnapshot(messagesQuery, cb);
}
