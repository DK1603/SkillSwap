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
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  updateDoc
} from 'firebase/firestore';

// ─── 1. Your Firebase config ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBsrHV--l-LFHls3HMjy7XQMmxKg04MCc0",
  authDomain: "skillswap-e10d6.firebaseapp.com",
  projectId: "skillswap-e10d6",
  storageBucket: "skillswap-e10d6.firebasestorage.app",
  messagingSenderId: "607068548148",
  appId: "1:607068548148:web:c5939bcbb0055a2b402e61",
  measurementId: "G-SV8BZEC5RX"
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
  console.log(data);
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

// Get User Name by teacher UID
export async function getUserDisplayName(uid) {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return snapshot.data().displayName || '알 수 없음';
  }
  return '알 수 없음';
}

// Get average rating for a lesson
export async function calculateAverageRating(lessonId) {
  const reviewsRef = collection(db, 'lessons', lessonId, 'reviews');
  const snapshot = await getDocs(reviewsRef);

  let total = 0;
  let count = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (typeof data.rating === 'number') {
      total += data.rating;
      count += 1;
    }
  });

  const avg = count > 0 ? total / count : 0;

  // 소수점 첫째 자리까지 반올림
  return Math.round(avg * 10) / 10;
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

// ─── 6.5 Firestore: Review for Lesson ────────────────────────────────────────────
export async function deleteReview(lessonId, reviewId) {
  const reviewDocRef = doc(db, 'lessons', lessonId, 'reviews', reviewId)
  return await deleteDoc(reviewDocRef);
}

export async function submitReview(lessonId, uid, data) {
  const reviewColRef = collection(db, 'lessons', lessonId, 'reviews');
  console.log(data);
  return await addDoc(reviewColRef, {
    ...data,
    uid: uid,
    createdAt: serverTimestamp()
  })
}

export async function fetchReviews(lessonId) {
  const reviewColRef = collection(db, "lessons", lessonId, "reviews");
  const snapshot = await getDocs(reviewColRef);
  const arr = [];
  snapshot.docs.forEach((doc) => {
    arr.push({id: doc.id, ...doc.data()});
  });
  return arr;
}

// ─── 6.6 Firestore: Close Lesson ─────────────────────────────────────────────────
export async function closeLesson(lessonObj, uid, afterBalance) {
  const lessonDocRef = doc(db, "lessons", lessonObj.id);
  const userDocRef = doc(db, "users", uid);
  await updateDoc(lessonDocRef, {
    open: false
  });
  await updateDoc(userDocRef, {
    pointBalance: afterBalance
  });
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

export async function getEnrollments(lessonId) {
  const enrolledCol = collection(db, "lessons", lessonId, "enrollments");
  const snapshot = await getDocs(enrolledCol);
  return snapshot.docs.map((doc) => {
    return {id: doc.id, ...doc.data()};
  });
}

export function addTeachingShortcut(uid, lessonId) {
  const teachingDocRef = doc(db, 'users', uid, 'teaching', lessonId);
  return setDoc(teachingDocRef, { linkedAt: serverTimestamp() });
}

export function addEnrolledShortcut(uid, lessonId) {
  const enrolledDocRef = doc(db, 'users', uid, 'enrolled', lessonId);
  return setDoc(enrolledDocRef, { linkedAt: serverTimestamp() });
}
// ─── 7.5. Delete “enrolled” shortcut ────────────────────────────────────────────
//    (so that /users/{uid}/enrolled/{lessonId} is removed when cancelling)
export function deleteEnrolledShortcut(uid, lessonId) {
  const enrolledDocRef = doc(db, 'users', uid, 'enrolled', lessonId);
  return deleteDoc(enrolledDocRef);
}

// ─── 8. Firestore: Chats Collection ──────────────────────────────────────────────
export async function startChat(meUid, youUid) {
  const chatRef = await addDoc(collection(db, 'chats'), {
    members: [meUid, youUid],
    createdAt: serverTimestamp()
  });
  return chatRef.id;
}

export async function sendMessage(chatId, authorUid, text) {
  const messagesCol = collection(db, 'chats', chatId, 'messages');
  const messageRef = await getDocs(messagesCol);
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

export async function viewChats(meUid) {
  const chatRef = collection(db, 'chats');
  const q = query(
    chatRef,
    where("members", "array-contains", meUid)
  )
  const snapshot = await getDocs(q);
  const arr = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    data.messages = [];

    arr.push({id: doc.id, ...data});
  })

  return arr;
}

export async function viewMessages(chatId) {
  const msgRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    msgRef,
    orderBy('sentAt')
  )
  const msgSnapshot = await getDocs(q);
  const messages = [];
  msgSnapshot.forEach((sn) => {
    messages.push({id: sn.id, ...sn.data()});
  });
  return messages;
}
