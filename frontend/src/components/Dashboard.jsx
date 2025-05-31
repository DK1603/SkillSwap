// src/components/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  db,
  watchTeaching,
  watchEnrolled
} from '../services/firebase';
import {
  getDoc,
  doc,
  updateDoc,
  getDocs,
  collection
} from 'firebase/firestore';
import { fetchLessonsOnce } from '../services/firebase';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user: authUser } = useAuth(); // Firebase Auth user
  const uid = authUser?.uid;

  // Local state
  const [profileData, setProfileData] = useState({
    displayName: '',
    photoURL: '',
    pointBalance: 0
  });
  const [editing, setEditing] = useState(false);

  // Arrays of lesson‐detail objects
  const [teachingLessons, setTeachingLessons] = useState([]);
  const [enrolledLessons, setEnrolledLessons] = useState([]);

  // 1) Load user profile doc (/users/{uid}) on mount + whenever uid changes:
  useEffect(() => {
    if (!uid) return;
    const userDocRef = doc(db, 'users', uid);

    // We can use getDoc once; if you want realtime updates, swap in onSnapshot.
    getDoc(userDocRef).then((snap) => {
      if (snap.exists()) {
        setProfileData(snap.data());
      } else {
        // If user doc doesn’t exist yet, create a default one.
        // (Optional helper—uncomment if you want to auto‐create)
        // setDoc(userDocRef, {
        //   displayName: authUser.displayName || '',
        //   photoURL: authUser.photoURL || '',
        //   pointBalance: 100,            // default points
        // });
        console.warn('User doc not found; please create /users/' + uid);
      }
    });
  }, [uid]);

  // 2) When profileData.editing is toggled off, save changes to Firestore:
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
    }
  };

  // 3) Watch “teaching” shortcuts: /users/{uid}/teaching
  //    that stores a doc with lessonId = ID of lesson they created.
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = watchTeaching(uid, async (snapshot) => {
      // snapshot.docs are the “teaching” shortcut docs (IDs = lesson IDs)
      const lessonIds = snapshot.docs.map(d => d.id);
      if (lessonIds.length === 0) {
        setTeachingLessons([]);
        return;
      }
      // Now fetch those lesson docs (batched)
      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeachingLessons(allLessons.filter(l => lessonIds.includes(l.id)));
    });
    return () => unsubscribe();
  }, [uid]);

  // 4) Watch “enrolled” shortcuts: /users/{uid}/enrolled
  useEffect(() => {
    if (!uid) return;
    const unsubscribe = watchEnrolled(uid, async (snapshot) => {
      const lessonIds = snapshot.docs.map(d => d.id);
      if (lessonIds.length === 0) {
        setEnrolledLessons([]);
        return;
      }
      // Re‐fetch all lessons then filter
      const fetched = await fetchLessonsOnce();
      const allLessons = fetched.docs.map(d => ({ id: d.id, ...d.data() }));
      setEnrolledLessons(allLessons.filter(l => lessonIds.includes(l.id)));
    });
    return () => unsubscribe();
  }, [uid]);

  // If not logged in, show a simple message
  if (!authUser) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Please log in to see your dashboard.</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem', fontFamily: '"Segoe UI", sans-serif' }}>
      {/* ------------------------- */}
      {/* Left Sidebar: Profile */}
      {/* ------------------------- */}
      <div
        style={{
          width: 220,
          textAlign: 'center',
          border: '1px solid #ddd',
          borderRadius: 6,
          padding: '1rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <img
          src={profileData.photoURL || '/profile-placeholder.png'}
          alt="Profile"
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '0.5rem'
          }}
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
                fontSize: '0.9rem'
              }}
            >
              Save
            </button>
            &nbsp;
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
            <p style={{ margin: '0.25rem 0', color: '#555' }}>Points: {profileData.pointBalance ?? 0}</p>
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
            <hr style={{ margin: '1rem 0' }} />
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

      {/* ------------------------- */}
      {/* Right Panel: Lessons */}
      {/* ------------------------- */}
      <div style={{ flex: 1 }}>
        <h2 style={{ marginBottom: '1rem', color: '#333' }}>Dashboard</h2>

        {/* --- My Upcoming (Enrolled) Lessons --- */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>My Upcoming Lessons</h3>
          {enrolledLessons.length === 0 ? (
            <p style={{ color: '#777' }}>You’re not enrolled in any lessons.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {enrolledLessons.map(lesson => (
                <li
                  key={lesson.id}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ color: '#333' }}>{lesson.title}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      {new Date(lesson.startTime.seconds * 1000).toLocaleString()}
                    </small>
                  </div>
                  <Link to={`/lesson/${lesson.id}`}>
                    <button
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- My Lessons (Teaching) --- */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>My Lessons (Teaching)</h3>
          {teachingLessons.length === 0 ? (
            <p style={{ color: '#777' }}>You haven’t created any lessons yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teachingLessons.map(lesson => (
                <li
                  key={lesson.id}
                  style={{
                    padding: '0.75rem 1rem',
                    border: '1px solid #eee',
                    borderRadius: 4,
                    marginBottom: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ color: '#333' }}>{lesson.title}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      {new Date(lesson.createdAt.seconds * 1000).toLocaleString()}
                    </small>
                  </div>
                  <Link to={`/lesson/${lesson.id}`}>
                    <button
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Edit Profile Section (Optional Duplicate) --- */}
        {/* You could remove this since we have inline editing above */}
      </div>
    </div>
  );
}
