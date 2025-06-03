// src/components/Dashboard.jsx

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  watchTeaching,
  watchEnrolled,
  fetchLessonsOnce,
  cancelEnrollment,
  deleteEnrolledShortcut,
  fetchUserTeaching,
  getEnrollments,
  closeLesson,
  fetchReviews,
  fetchUserReview,
  fetchEnrolledHistory
} from '../services/firebase';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';

const categories = [
  { value: 'programming', icon: '💻', label: '프로그래밍' },
  { value: 'economics', icon: '💰', label: '경제' },
  { value: 'math', icon: '➗', label: '수학' },
  { value: 'science', icon: '🔬', label: '과학' },
  { value: 'cooking', icon: '🍳', label: '요리' },
  { value: 'design', icon: '🎨', label: '디자인' },
  { value: 'self-development', icon: '🧭', label: '자기계발' }
];

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const uid = authUser?.uid;
  const navigate = useNavigate();

  // ─── Local state ───────────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    displayName: '',
    photoURL: '',
    pointBalance: 0
  });
  const [editing, setEditing] = useState(false);

  const [teachingLessons, setTeachingLessons] = useState([]);
  const [enrolledLessons, setEnrolledLessons] = useState([]);

  // Modal state
  const [showModalFor, setShowModalFor] = useState(null);
  const [showModalMylessonFor, setShowModalMylessonFor] = useState(null);
  const [myLessonEdit, setMyLessonEdit] = useState(null);
  const [showClose, setShowClose] = useState(false);
  const [closeLessonObj, setCloseLessonObj] = useState(null);

  // ─── NEW: History & Reviews modal state ───────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [allLessonsHistory, setAllLessonsHistory] = useState([]);

  // ─── NEW: Toast message ───────────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState('');

  // ─── 1) Load /users/{uid} into profileData ────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    getDoc(userDocRef).then((snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      }
    });
  }, [uid]);

  const handleProfileSave = async () => {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
      setEditing(false);
      showToast('Profile updated.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Error updating profile: ' + err.message);
    }
  };

  // ─── 2) Subscribe to /users/{uid}/teaching ───────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = watchTeaching(uid, async (snapshot) => {
      const lessonIds = snapshot.docs.map(d => d.id);
      if (lessonIds.length === 0) {
        setTeachingLessons([]);
        return;
      }
      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      const teaching = allLessons.filter(l => lessonIds.includes(l.id));
      for (const idx in teaching) {
        const lessonId = teaching[idx].id;
        const reviews = await fetchReviews(lessonId);
        teaching[idx].reviews = reviews;
      }
      setTeachingLessons(teaching);
    });
    return () => unsubscribe();
  }, [uid]);

  // ─── 3) Subscribe to /users/{uid}/enrolled ───────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = watchEnrolled(uid, async (snapshot) => {
      const lessonIds = snapshot.docs.map(d => d.id);
      if (lessonIds.length === 0) {
        setEnrolledLessons([]);
        return;
      }
      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      setEnrolledLessons(allLessons.filter(l => lessonIds.includes(l.id)));
    });
    return () => unsubscribe();
  }, [uid]);

  // ─── NEW: showToast helper ───────────────────────────────────────────────────
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── 4) Modal‐related handlers ───────────────────────────────────────────────
  const handleViewClick = (lessonObj) => {
    setShowModalFor(lessonObj);
  };
  const closeModal = () => {
    setShowModalFor(null);
  };

  const handleEditClick = (lessonObj) => {
    setShowModalMylessonFor(lessonObj);
    setMyLessonEdit({
      ...lessonObj,
      description: lessonObj.description || '',
      thumbnailURL: lessonObj.thumbnailURL || '',
      tags: lessonObj.tags.map(t => categories.find(c => c.value === t))
    });
  };
  const closeLessonEditModal = () => {
    setShowModalMylessonFor(null);
    setMyLessonEdit(null);
  };

  const handleCloseClick = useCallback(async (lessonObj) => {
    const enrollments = await getEnrollments(lessonObj.id);
    setCloseLessonObj({ ...lessonObj, enrollments });
    setShowClose(true);
  }, []);

  const handleCloseConfirm = useCallback(async (lessonObj, afterBalance) => {
    try {
      await closeLesson(lessonObj, uid, afterBalance);
      setCloseLessonObj(null);
      setShowClose(false);

      // Refresh teaching lessons
      const snapshot = await fetchUserTeaching(uid);
      const lessonIds = snapshot.docs.map(d => d.id);
      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      const teaching = allLessons.filter(l => lessonIds.includes(l.id));
      for (const idx in teaching) {
        const reviews = await fetchReviews(teaching[idx].id);
        teaching[idx].reviews = reviews;
      }
      setTeachingLessons(teaching);

      // Refresh profile
      const userDocRef = doc(db, 'users', uid);
      getDoc(userDocRef).then((snap) => {
        if (snap.exists()) setProfileData(snap.data());
      });

      showToast('Lesson closed and points refunded.');
    } catch (err) {
      console.error('Error closing lesson:', err);
      showToast('Failed to close lesson: ' + err.message);
    }
  }, [uid]);

  const handleLessonEdit = async () => {
    if (!myLessonEdit || !uid) return;
    const lessonDocRef = doc(db, 'lessons', myLessonEdit.id);
    try {
      await updateDoc(lessonDocRef, {
        title: myLessonEdit.title,
        description: myLessonEdit.description,
        thumbnailURL: myLessonEdit.thumbnailURL,
        category: myLessonEdit.category,
        tags: myLessonEdit.tags.map(t => t.value)
      });

      const snapshot = await fetchUserTeaching(uid);
      const lessonIds = snapshot.docs.map(d => d.id);
      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      const teaching = allLessons.filter(l => lessonIds.includes(l.id));
      for (const idx in teaching) {
        const reviews = await fetchReviews(teaching[idx].id);
        teaching[idx].reviews = reviews;
      }
      setTeachingLessons(teaching);
      closeLessonEditModal();
      showToast('Lesson updated.');
    } catch (err) {
      console.error('Failed to update lesson:', err);
      showToast('Error updating lesson: ' + err.message);
    }
  };

  // ─── “Delete Enrollment” flow ────────────────────────────────────────────────
  const handleDeleteEnrollment = async (lessonObj) => {
    const reason = window.prompt('Please enter a reason for canceling this enrollment:');
    if (reason === null) return;
    if (reason.trim() === '') {
      showToast('Cancellation reason cannot be empty.');
      return;
    }
    try {
      await cancelEnrollment(lessonObj.id, uid);
      await deleteEnrolledShortcut(uid, lessonObj.id);
      setEnrolledLessons(prev => prev.filter(l => l.id !== lessonObj.id));
      showToast('Enrollment canceled.');
      closeModal();
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      if (err.code === 'permission-denied') {
        showToast('You can only cancel at least 2 minutes after enrolling.');
      } else {
        showToast('Failed to cancel: ' + err.message);
      }
    }
  };

  const handleContact = (lessonObj) => {
    navigate(`/chats?member=${lessonObj.teacherUid}`);
    closeModal();
  };

  const handleViewInFeed = (lessonObj) => {
    navigate(`/lesson/${lessonObj.id}`);
    closeModal();
  };

  // ─── NEW: When showHistory toggles on, gather history & reviews ─────────────────
  useEffect(() => {
    if (!showHistory || !uid) return;

    (async () => {
      try {
        // 1) Taught lessons IDs
        const teachingSnap = await fetchUserTeaching(uid);
        const taughtIds = teachingSnap.docs.map(d => d.id);

        // 2) Attended lessons IDs
        const attendedLessons = await fetchEnrolledHistory(uid);
        const attendedIds = attendedLessons.map(l => l.id);

        // 3) Unique lesson IDs
        const uniqueLessonIds = Array.from(new Set([...taughtIds, ...attendedIds]));

        // 4) Build history array
        const historyArr = [];
        for (let lessonId of uniqueLessonIds) {
          const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
          if (!lessonDoc.exists()) continue;
          const lessonData = lessonDoc.data();

          // 4.a) Determine role
          const role = taughtIds.includes(lessonId) ? 'Taught' : 'Attended';

          // 4.b) Fetch this user’s review (if any)
          const reviewDoc = await fetchUserReview(lessonId, uid);
          const userReviewText = reviewDoc?.text || '— No review yet —';

          historyArr.push({
            lessonId,
            title: lessonData.title,
            role,
            yourReview: userReviewText,
            closed: lessonData.open === false
          });
        }

        setAllLessonsHistory(historyArr);
      } catch (err) {
        console.error('Failed to load history:', err);
        showToast('Error loading history.');
      }
    })();
  }, [showHistory, uid]);

  if (!authUser) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Please log in to see your dashboard.</h2>
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      display: 'flex',
      gap: '2rem',
      background: '#121212',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      {/* ─── Left Sidebar: Profile ────────────────────────────────────────────── */}
      <div style={{
        width: 240,
        textAlign: 'center',
        border: '1px solid #333',
        borderRadius: 8,
        padding: '1rem',
        background: '#1e1e1e'
      }}>
        <img
          src={profileData.photoURL || '/assets/profile-placeholder.png'}
          alt="Profile"
          style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem' }}
        />
        {editing ? (
          <>
            <input
              type="text"
              value={profileData.displayName}
              onChange={e => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Display Name"
              style={{
                width: '100%',
                padding: '0.4rem',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                borderRadius: 4,
                border: '1px solid #ccc'
              }}
            />
            <input
              type="text"
              value={profileData.photoURL}
              onChange={e => setProfileData(prev => ({ ...prev, photoURL: e.target.value }))}
              placeholder="Photo URL"
              style={{
                width: '100%',
                padding: '0.4rem',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                borderRadius: 4,
                border: '1px solid #ccc'
              }}
            />
            <button
              onClick={handleProfileSave}
              style={{
                backgroundColor: '#2ecc71',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.9rem',
                marginRight: '0.5rem'
              }}
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <h3 style={{ margin: '0.5rem 0' }}>{profileData.displayName || 'No Name'}</h3>
            <p style={{ margin: '0.25rem 0', color: '#00bcd4' }}>
              Points: {profileData.pointBalance ?? 0}
            </p>
            <button
              onClick={() => setEditing(true)}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Edit Profile
            </button>
            <hr style={{ margin: '1rem 0', borderColor: '#333' }} />
            <Link to="/create">
              <button
                style={{
                  backgroundColor: '#9b59b6',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Create Lesson
              </button>
            </Link>
          </>
        )}
      </div>

      {/* ─── Right Panel: Dashboard Content ────────────────────────────────────── */}
      <div style={{ flex: 1 }}>
        <h2 style={{ marginBottom: '1rem', color: '#ccc' }}>Dashboard</h2>

        {/* --- History & Reviews Button --- */}
        <button
          onClick={() => setShowHistory(true)}
          style={{
            marginBottom: '1.5rem',
            backgroundColor: '#ffc107',
            color: '#000',
            border: 'none',
            padding: '0.6rem 1.2rem',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          View My History & Reviews
        </button>

        {/* --- My Upcoming (Enrolled) Lessons --- */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#bbb' }}>
            My Upcoming Lessons
          </h3>
          {enrolledLessons.length === 0 ? (
            <p style={{ color: '#777' }}>You’re not enrolled in any lessons.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {enrolledLessons.map(lesson => {
                const startTime = lesson.startTime && lesson.startTime.seconds
                  ? new Date(lesson.startTime.seconds * 1000).toLocaleString()
                  : 'TBD';
                return (
                  <li
                    key={lesson.id}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #333',
                      borderRadius: 4,
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#1f1f1f'
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{lesson.title}</strong>
                      <br />
                      <small style={{ color: '#aaa' }}>{startTime}</small>
                    </div>
                    <button
                      onClick={() => handleViewClick(lesson)}
                      style={{
                        backgroundColor: '#2980b9',
                        color: '#fff',
                        border: 'none',
                        padding: '0.4rem 0.8rem',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      View
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* --- My Lessons (Teaching) --- */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#bbb' }}>
            My Lessons (Teaching)
          </h3>
          {teachingLessons.length === 0 ? (
            <p style={{ color: '#777' }}>You haven’t created any lessons yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teachingLessons.map(lesson => {
                const createdAt = lesson.createdAt && lesson.createdAt.seconds
                  ? new Date(lesson.createdAt.seconds * 1000).toLocaleString()
                  : 'TBD';
                if (lesson.open === false) {
                  return null;
                }
                return (
                  <li
                    key={lesson.id}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #333',
                      borderRadius: 4,
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#1f1f1f'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff' }}>{lesson.title}</strong>
                        <br />
                        <small style={{ color: '#aaa' }}>{createdAt}</small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        disabled={!lesson.open || lesson.reviews.length === 0}
                        onClick={() => handleCloseClick(lesson)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleEditClick(lesson)}
                        style={{
                          backgroundColor: '#8e44ad',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ─── Modal Popup for Enrolled Lesson ─────────────────────────────────────── */}
      {showModalFor && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#1f1f1f',
            borderRadius: 8,
            width: '90%',
            maxWidth: 380,
            padding: '1.5rem',
            color: '#fff',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {showModalFor.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => handleContact(showModalFor)}
                style={{
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Contact Teacher (Chat)
              </button>
              <button
                onClick={() => handleDeleteEnrollment(showModalFor)}
                style={{
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Delete Enrollment
              </button>
              <button
                onClick={() => handleViewInFeed(showModalFor)}
                style={{
                  backgroundColor: '#17a2b8',
                  color: '#fff',
                  border: 'none',
                  padding: '0.6rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                View in Lesson Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Popup for Teaching Lesson Edit ───────────────────────────────── */}
      {showModalMylessonFor && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#1f1f1f',
            borderRadius: 8,
            width: '90%',
            maxWidth: 380,
            padding: '1.5rem',
            color: '#fff',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <button
              onClick={closeLessonEditModal}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
              {showModalMylessonFor.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ color: '#fff', fontSize: '0.9rem' }}>Description</label>
                <textarea
                  value={myLessonEdit.description}
                  onChange={e => setMyLessonEdit(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description…"
                  style={{
                    padding: '0.4rem',
                    fontSize: '0.9rem',
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    resize: 'vertical',
                    minHeight: 60
                  }}
                />
              </div>

              {/* Thumbnail URL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ color: '#fff', fontSize: '0.9rem' }}>Thumbnail URL</label>
                <input
                  type="text"
                  value={myLessonEdit.thumbnailURL}
                  onChange={e => setMyLessonEdit(prev => ({ ...prev, thumbnailURL: e.target.value }))}
                  placeholder="Paste thumbnail URL"
                  style={{
                    padding: '0.4rem',
                    fontSize: '0.9rem',
                    borderRadius: 4,
                    border: '1px solid #ccc'
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p>Category</p>
                <select
                  value={myLessonEdit.category}
                  onChange={e => setMyLessonEdit(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    padding: '0.4rem',
                    fontSize: '0.9rem',
                    borderRadius: 4,
                    border: '1px solid #ccc'
                  }}
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: '#fff' }}>Tags</p>
                <Select
                  isMulti
                  options={categories}
                  value={myLessonEdit.tags}
                  onChange={selected => setMyLessonEdit(prev => ({ ...prev, tags: selected }))}
                  styles={{
                    container: base => ({ ...base, width: '60%' })
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={handleLessonEdit}
                style={{
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal for Closing Lesson ────────────────────────────────── */}
      {showClose && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#000000',
              padding: '2rem',
              borderRadius: 8,
              width: 300,
              textAlign: 'center'
            }}
          >
            <h3>Confirm Close</h3>
            <p style={{ color: 'red' }}>You cannot undo this action!</p>
            <p>
              Current Points: <strong>{profileData.pointBalance ?? 0} pts</strong>
            </p>
            <p>
              Points After Closing:{' '}
              <strong>
                {(profileData.pointBalance ?? 0) + closeLessonObj.enrollments.length * closeLessonObj.cost} pts
              </strong>
            </p>
            <button
              onClick={() =>
                handleCloseConfirm(
                  closeLessonObj,
                  (profileData.pointBalance ?? 0) + closeLessonObj.enrollments.length * closeLessonObj.cost
                )
              }
              style={{
                marginTop: '1rem',
                background: '#c0392b',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: 6,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => setShowClose(false)}
              style={{
                marginLeft: '1rem',
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── NEW: History & Reviews Modal ───────────────────────────────────────── */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 5000
        }}>
          <div style={{
            background: '#2c2c2c',
            borderRadius: 8,
            width: '90%',
            maxWidth: 500,
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '1.5rem',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowHistory(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'transparent',
                border: 'none',
                color: '#bbb',
                fontSize: '1.4rem',
                cursor: 'pointer'
              }}
            >
              &times;
            </button>

            <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#ffc107' }}>
              My Course History & Reviews
            </h2>

            {allLessonsHistory.length === 0 ? (
              <p style={{ color: '#ccc' }}>You have no history yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {allLessonsHistory.map(entry => (
                  <li
                    key={entry.lessonId}
                    style={{
                      background: '#3a3a3a',
                      padding: '0.8rem 1rem',
                      borderRadius: 4,
                      marginBottom: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1rem', color: '#fff' }}>
                        {entry.title}
                      </strong>
                      <span style={{
                        fontSize: '0.85rem',
                        color: entry.role === 'Taught' ? '#00e676' : '#29b6f6'
                      }}>
                        {entry.role}
                      </span>
                    </div>
                    {entry.closed && (
                      <div style={{
                        marginTop: '0.3rem',
                        background: '#c0392b',
                        color: '#fff',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.5rem',
                        display: 'inline-block',
                        fontSize: '0.75rem'
                      }}>
                        Closed
                      </div>
                    )}
                    <p style={{ margin: '0.6rem 0', fontSize: '0.9rem', color: '#ddd' }}>
                      <strong>My Review:</strong> <em>{entry.yourReview}</em>
                    </p>
                    <button
                      onClick={() => navigate(`/lesson/${entry.lessonId}`)}
                      style={{
                        backgroundColor: '#ff5722',
                        color: '#fff',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      View Lesson Details
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ─── NEW: Toast container ─────────────────────────────────────────────────── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: 4,
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 3000,
          fontSize: '0.9rem'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
