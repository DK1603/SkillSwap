// src/components/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  watchTeaching,
  watchEnrolled,
  fetchLessonsOnce,
  cancelEnrollment,
  deleteEnrolledShortcut,            // → CHANGED: import the new helper
  fetchUserTeaching
} from '../services/firebase';
import { getDoc, doc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';     // to get /users/{uid}
import { Link, useNavigate } from 'react-router-dom';
import Select from 'react-select';

const categories = [
  { value: 'programming', icon: '💻', label: '프로그래밍' },
  { value: 'economics', icon: '💰', label: '경제' },
  { value: 'math', icon: '➗', label: '수학' },
  { value: 'science', icon: '🔬', label: '과학'},
  { value: 'cooking', icon: '🍳', label: '요리' },
  { value: 'design', icon: '🎨', label: '디자인' },
  { value: 'self-development', icon: '🧭', label: '자기계발' },
];

export default function Dashboard() {
  const { user: authUser } = useAuth(); // Firebase Auth user
  const uid = authUser?.uid;
  const navigate = useNavigate();

  // ─── Local state ───────────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState({
    displayName: '',
    photoURL: '',
    pointBalance: 0
  });
  const [editing, setEditing] = useState(false);

  const [teachingLessons, setTeachingLessons] = useState([]);   // { id, …lessonData }
  const [enrolledLessons, setEnrolledLessons] = useState([]);   // { id, …lessonData }

  // Which lesson’s modal is open? null = no modal
  const [showModalFor, setShowModalFor] = useState(null);
  const [showModalMylessonFor, setShowModalMylessonFor] = useState(null);
  const [myLessonEdit, setMyLessonEdit] = useState(null);

  // ─── NEW: “Toast” message state ────────────────────────────────────────────────
  // We’ll use this to show a styled success/error message instead of window.alert
  const [toastMessage, setToastMessage] = useState('');

  // ─── 1) Load /users/{uid} into profileData ────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    getDoc(userDocRef).then((snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      } else {
        console.warn('No user doc exists at /users/' + uid);
      }
    });
  }, [uid]);

  // Save profile changes when “Save” is clicked
  const handleProfileSave = async () => {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);
    try {
      await updateDoc(userDocRef, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL
      });
      setEditing(false);
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
      setTeachingLessons(allLessons.filter(l => lessonIds.includes(l.id)));
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
  // Sets toastMessage for 3 seconds, then clears it
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ─── 4) Modal‐related handlers ───────────────────────────────────────────────

  // “View” clicked on an enrolled lesson → open the modal
  const handleViewClick = (lessonObj) => {
    setShowModalFor(lessonObj);
  };

  // Close the modal
  const closeModal = () => {
    setShowModalFor(null);
  };

  const handleEditClick = (lessonObj) => {
    setShowModalMylessonFor(lessonObj);
    setMyLessonEdit({...lessonObj, tags: lessonObj.tags.map((t) => categories.find(c => c.value === t))});
  };

  // Close the modal
  const closeMylessonModal = () => {
    setShowModalMylessonFor(null);
    setMyLessonEdit(null);
  };

  // Save profile changes when “Save” is clicked
  const handleLessonEdit = async () => {
    if (!myLessonEdit || !uid) return;
    const lessonDocRef = doc(db, 'lessons', myLessonEdit.id);
    try {
      await updateDoc(lessonDocRef, {
        title: myLessonEdit.title,
        category: myLessonEdit.category,
        tags: myLessonEdit.tags.map((t) => t.value)
      });

      const snapshot = await fetchUserTeaching(uid);
      const lessonIds = snapshot.docs.map(d => d.id);

      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachingLessons(allLessons.filter(l => lessonIds.includes(l.id)));
      closeMylessonModal()
    } catch (err) {
      console.error('Failed to update lesson:', err);
      showToast('Error updating Lesson: ' + err.message);
    }
  };

  // console.log(teachingLessons);

  // ─── “Delete Enrollment” flow ────────────────────────────────────────────────
  const handleDeleteEnrollment = async (lessonObj) => {
    // 1) Prompt for reason
    const reason = window.prompt('Please enter a reason for canceling this enrollment:');
    if (reason === null) {
      // User pressed “Cancel” in the prompt → do nothing
      return;
    }
    if (reason.trim() === '') {
      showToast('Cancellation reason cannot be empty.');
      return;
    }

    try {
      // 2.a) Delete from /lessons/{lessonId}/enrollments/{uid}
      await cancelEnrollment(lessonObj.id, uid);

      // 2.b) ALSO delete the “enrolled” shortcut at /users/{uid}/enrolled/{lessonId}
      await deleteEnrolledShortcut(uid, lessonObj.id);

      // 3) Remove the lesson immediately from local state
      setEnrolledLessons((prev) => prev.filter(l => l.id !== lessonObj.id));

      // 4) Show a React “toast” message
      showToast('Enrollment has been canceled successfully.');
      closeModal();
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      if (err.code === 'permission-denied') {
        showToast('You can only cancel an enrollment 2+ minutes after enrolling.');
      } else {
        showToast('Failed to delete enrollment: ' + err.message);
      }
    }
  };

  // ─── “Contact Teacher (Chat)” → navigate to a chat route ─────────────────────
  const handleContact = (lessonObj) => {
    const teacherId = lessonObj.teacherUid;
    navigate(`/chats?member=${teacherId}`);
    closeModal();
  };

  // ─── “View in Lesson Feed” → navigate to /lesson/{lessonId} ─────────────────
  const handleViewInFeed = (lessonObj) => {
    navigate(`/lesson/${lessonObj.id}`);
    closeModal();
  };

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
                      <small style={{ color: '#aaa' }}>{createdAt}</small>
                    </div>
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
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* ─── Modal Popup (conditionally rendered) ─────────────────────────────────── */}
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
            {/* Close “X” */}
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
              {/* 1) Contact Teacher (Chat) */}
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

              {/* 2) Delete Enrollment */}
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

              {/* 3) View in Lesson Feed */}
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

      {showModalMylessonFor && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            background: '#1f1f1f',
            borderRadius: 8,
            width: '90%',
            maxWidth: 380,
            padding: '1.5rem',
            // color: 'black',
            color: "#fff",
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            {/* Close “X” */}
            <button
              onClick={closeMylessonModal}
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
              <div style={{
                display: "flex",
                justifyContent: "space-between",
              }}>
                <p>Title</p>
                <input
                  type="text"
                  value={myLessonEdit.title}
                  onChange={e => setMyLessonEdit(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  style={{
                    padding: '0.4rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    borderRadius: 4,
                    border: '1px solid #ccc'
                  }}
                />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
              }}>
                <p>Category</p>
                <select
                  type="text"
                  value={myLessonEdit.category}
                  onChange={e => setMyLessonEdit(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Title"
                  style={{
                    padding: '0.4rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    borderRadius: 4,
                    border: '1px solid #ccc'
                  }}
                >
                {
                  categories.map((c, idx) => {
                    return <option key={c.value} value={c.value}>{c.label}</option>
                  })
                }
                </select>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                color: "black"
              }}>
                <p style={{color: "#fff"}}>Tags</p>
                <Select
                  isMulti
                  options={categories}
                  value={myLessonEdit.tags}
                  onChange={(selected) => setMyLessonEdit(prev => ({...prev, tags: selected}))}
                  style={{
                    padding: '0.4rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem',
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    width: "50%"
                  }}
                >
                <p>
                  Selected: {myLessonEdit.tags.map(opt => opt.label).join(', ')}
                </p>
                </Select>
              </div>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              color: "black"
            }}>
              <div></div>
              <button 
                onClick={handleLessonEdit}
                style={{
                  textAlign: "end"
              }}>
                Edit
              </button>

            </div>
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
