// src/components/LessonDetails.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  Timestamp,
  updateDoc    // <-- IMPORT updateDoc here
} from 'firebase/firestore';

import { deleteReview, getUserDisplayName, submitReview } from '../services/firebase';

import {
  db,
  enroll,
  addEnrolledShortcut
} from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function LessonDetails() {
  const { id } = useParams();
  const { user: authUser } = useAuth();
  const uid = authUser?.uid;

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [edit, setEdit] = useState(false);
  const [addReview, setAddReview] = useState({ description: "", rating: 5 });

  // 1) Fetch single lesson document from Firestore
  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'lessons', id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setErrorMessage('Lesson not found.');
          setLesson(null);
        } else {
          setLesson({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
        setErrorMessage('Failed to load lesson details.');
      }
      setLoading(false);
    };

    fetchLesson();
  }, [id]);

  // 2) Fetch current user’s pointBalance (for enrollment check)
  useEffect(() => {
    if (!uid) return;
    const fetchPoints = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) {
          setUserPoints(userSnap.data().pointBalance ?? 0);
        }
      } catch (err) {
        console.error('Error fetching user points:', err);
      }
    };
    fetchPoints();
  }, [uid]);

  // 3) Count how many students are already enrolled
  useEffect(() => {
    const fetchEnrollmentCount = async () => {
      try {
        const enrollColRef = collection(db, 'lessons', id, 'enrollments');
        const snapshot = await getDocs(enrollColRef);
        setRegisteredCount(snapshot.size);
        // If the UID is already in that collection, mark as enrolled
        const isAlreadyEnrolled = snapshot.docs.some((d) => d.id === uid);
        if (isAlreadyEnrolled) {
          setEnrolled(true);
        }
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      }
    };
    fetchEnrollmentCount();
  }, [id, uid]);


  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'lessons', id, 'reviews'));
        const temp = await Promise.all(snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const userName = await getUserDisplayName(data.uid);
          return { id: docSnap.id, ...data, userName };
        }));
        setReviews(temp);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    fetchReviews();
  }, [id]);

  const handleDeleteReview = useCallback( async (reviewId) => {
    try {
      await deleteReview(id, reviewId);

      const snapshot = await getDocs(collection(db, 'lessons', id, 'reviews'));
      const temp = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userName = await getUserDisplayName(data.uid);
        return { id: docSnap.id, ...data, userName };
      }));
      setReviews(temp);
    } catch(err) {
      console.error('Error deleting review:', err)
    }
  }, [id, setReviews]);

  const addHandler = useCallback(() => {
    setEdit(p => !p);
    setAddReview({ description: "", rating: 5 })
  }, [setEdit, setAddReview])

  const handleReviewSubmit = useCallback( async () => {
    try {
      await submitReview(id, uid, addReview);
      setEdit(false);
      setAddReview({ description: "", rating: 5 })

      const snapshot = await getDocs(collection(db, 'lessons', id, 'reviews'));
      const temp = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userName = await getUserDisplayName(data.uid);
        return { id: docSnap.id, ...data, userName };
      }));
      setReviews(temp);
    } catch(err) {
      console.log('Error submitting review:', err)
    }
  }, [id, uid, addReview, setEdit, setAddReview, setReviews])

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading…</div>;
  }
  if (errorMessage) {
    return <div style={{ color: 'red', padding: '2rem' }}>{errorMessage}</div>;
  }
  if (!lesson) {
    return <div style={{ padding: '2rem' }}>Lesson not found.</div>;
  }

  // Destructure fields from the Firestore document
  const {
    title,
    description,
    teacherUid,
    rating = 0,
    tags = [],
    cost = 0,
    sessionType = '',
    difficulty = '',
    startTime,
    createdAt,
    capacity = 0
  } = lesson;

  // Format startTime if it is a Firestore Timestamp
  let formattedStart = '';
  if (startTime instanceof Timestamp) {
    formattedStart = new Date(startTime.seconds * 1000).toLocaleString();
  }

  // Handler for “Enroll” button
  const handleEnroll = async () => {
    if (!uid) {
      alert('Please log in first.');
      return;
    }
    if (userPoints < cost) {
      alert('You do not have enough points to enroll.');
      return;
    }
    if (registeredCount >= capacity) {
      alert('No seats available.');
      return;
    }

    try {
      // 1) Create enrollment under /lessons/{id}/enrollments/{uid}
      await enroll(id, uid);

      // 2) Add “enrolled” shortcut under /users/{uid}/enrolled/{id}
      await addEnrolledShortcut(uid, id);

      // 3) Deduct points from the user document in Firestore
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, {
        pointBalance: userPoints - cost
      });

      // 4) Update local state after successful writes
      setEnrolled(true);
      setShowConfirm(false);
      setUserPoints((prev) => prev - cost);
      setRegisteredCount((prev) => prev + 1);

      alert('You have successfully enrolled in this lesson!');
    } catch (err) {
      console.error('Error enrolling or updating points:', err);
      alert('An error occurred while enrolling.');
    }
  };

  return (
    <div
      style={{
        background: '#f9f9f9',
        color: '#000000',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      {/**
       * ─── Header Section: Title + Thumbnail ─────────────────────────────────────────
       */}
      <div style={{ display: 'flex', padding: '2rem', background: '#000000', color: '#ffffff' }}>
        <div
          style={{
            flex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <h1 style={{ margin: 0, textAlign: 'left' }}>{title}</h1>
          <p style={{ margin: 0, textAlign: 'left', minHeight: '2.5rem' }}>{description}</p>
          {(lesson?.open === null || !lesson?.open) && <span
            style={{
              background: 'red',
              color: '#ffffff',
              padding: '0.2rem 1rem',
              borderRadius: '1rem',
              fontSize: '0.8rem',
              textAlign: "start",
              width: "fit-content"
            }}
          >
            closed
          </span>}
          {formattedStart && (
            <p style={{ margin: 0, textAlign: 'left' }}>🗓️ Start Date: {formattedStart}</p>
          )}
          <p style={{ margin: 0, textAlign: 'left' }}>👨‍🏫 {teacherUid} ⭐ {rating.toFixed(1)}</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  background: '#444444',
                  color: '#ffffff',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '1rem',
                  fontSize: '0.8rem'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: '100%',
              height: 200,
              background: '#cccccc',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Thumbnail
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '2rem', gap: '2rem', height: "30%" }}>
        {/**
         * ─── Left Info Box ─────────────────────────────────────────────────────────
         */}
        <div
          style={{
            flex: 1,
            background: '#ffffff',
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid #dddddd'
          }}
        >
          <table style={{ width: '100%', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <tbody>
              <tr>
                <td>Teacher</td>
                <td>{teacherUid}</td>
              </tr>
              <tr>
                <td>Capacity</td>
                <td>
                  {registeredCount} / {capacity}
                </td>
              </tr>
              <tr>
                <td>Session Type</td>
                <td>{sessionType}</td>
              </tr>
              <tr>
                <td>Cost</td>
                <td>{cost} pts</td>
              </tr>
              <tr>
                <td>Difficulty</td>
                <td>{difficulty}</td>
              </tr>
            </tbody>
          </table>

          {/* Enroll or Enrolled Button */}
          {!enrolled ? (
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                width: '100%',
                background: '#00b77e',
                color: '#ffffff',
                padding: '0.75rem',
                border: 'none',
                borderRadius: 6,
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Enroll ({cost} pts)
            </button>
          ) : (
            <button
              disabled
              style={{
                width: '100%',
                background: '#cccccc',
                color: '#666666',
                padding: '0.75rem',
                border: 'none',
                borderRadius: 6,
                fontSize: '1rem'
              }}
            >
              Enrolled
            </button>
          )}
        </div>

        {/**
         * ─── Center: (No chapters section, since you said "omit lecture hours")
         */}
        <div style={{ flex: 2, background: '#ffffff', padding: '1rem', borderRadius: 8, border: '1px solid #dddddd' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Lesson Details</h2>
          <p style={{ marginBottom: '1rem', lineHeight: 1.5 }}>{description}</p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Start Date & Time:</strong> {formattedStart || 'TBD'}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Session Type:</strong> {sessionType}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Difficulty Level:</strong> {difficulty}
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Cost:</strong> {cost} points
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Capacity:</strong> {registeredCount} / {capacity} students
          </p>
        </div>

        {/**
         * ─── Right Reviews / Comments (placeholder) ─────────────────────────────────
         */}
        <div style={{ flex: 1, borderRadius: 8, border: '1px solid #dddddd', padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", overflow: "auto" }}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <h3>📝 Reviews</h3>
            {enrolled && 
              <button 
                disabled={lesson?.open === null || !lesson?.open}
                style={{
                  background: (lesson?.open === null || !lesson?.open) ? "grey" : "",
                  color: (lesson?.open === null || !lesson?.open) ? "white" : "",
                  borderRadius: 8, 
                  border: '1px solid #cccccc',
                  cursor: (lesson?.open === null || !lesson?.open) ? "default" : "pointer"
                }} 
                onClick={addHandler}
              >
                {edit ? "Close" : "Add"}
              </button>
            }
          </div>
          {edit && <div style={{ flex: 1, borderRadius: 8, border: '1px solid #dddddd', padding: "1rem"}}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              gap: "0.5rem"
            }}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <div style={{textAlign: "start"}}>Description</div>
                <div style={{display: "flex", alignItems: "center"}}>
                  <div>⭐</div>
                  <select
                    defaultValue={addReview.rating}
                    onChange={e => setAddReview(p => ({...p, rating: parseInt(e.target.value) }))}
                    style={{
                      padding: '0.4rem',
                      fontSize: '0.9rem',
                      borderRadius: 4,
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                </div>
              </div>
              <textarea
                type="text"
                placeholder="Description"
                maxLength={1000}
                defaultValue={addReview.description}
                onChange={e => setAddReview(p => ({...p, description: e.target.value}))}
                style={{
                  padding: '0.4rem',
                  fontSize: '0.9rem',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  resize: "none",
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end"}}>
                <button onClick={handleReviewSubmit} style={{background: "#00A760", color: "white"}}>Submit</button>
              </div>
            </div>
          </div>}
          {(reviews.length === 0 && !edit) ? (
            <p style={{ color: '#777777', fontStyle: 'italic' }}>No reviews yet.</p>
          ) : (
            reviews.map((r, i) => (
              <div key={i} style={{ marginBottom: '1rem', padding: '0.5rem', background: '#eeeeee', borderRadius: 6 }}>
                <div style={{ fontWeight: 'bold' }}>{r.userName}</div>
                <div>⭐ {r.rating} / 5</div>
                <p style={{ marginTop: '0.25rem' }}>{r.description}</p>
                {(r.uid === uid) && 
                  <div style={{ display: "flex", justifyContent: "flex-end"}}>
                    <button onClick={() => handleDeleteReview(r.id)} style={{background: "red", color: "white"}}>delete</button>
                  </div>
                }
              </div>
            ))
          )}
        </div>

      </div>

      {/**
       * ─── Confirmation Modal for Enrollment ──────────────────────────────────────
       */}
      {showConfirm && (
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
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '2rem',
              borderRadius: 8,
              width: 300,
              textAlign: 'center'
            }}
          >
            <h3>Confirm Enrollment</h3>
            <p>
              Current Points: <strong>{userPoints} pts</strong>
            </p>
            <p>
              Points After Enrollment: <strong>{userPoints - cost} pts</strong>
            </p>
            <button
              onClick={handleEnroll}
              style={{
                marginTop: '1rem',
                background: '#00b77e',
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
              onClick={() => setShowConfirm(false)}
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
    </div>
  );
}
