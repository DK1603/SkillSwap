// src/components/CreateLesson.jsx

import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { useAuth } from '../contexts/AuthContext';
import {
  createLesson,
  addTeachingShortcut
} from '../services/firebase';

const categories = [
  { value: 'programming', icon: '💻', label: '프로그래밍' },
  { value: 'economics', icon: '💰', label: '경제' },
  { value: 'math', icon: '➗', label: '수학' },
  { value: 'science', icon: '🔬', label: '과학'},
  { value: 'cooking', icon: '🍳', label: '요리' },
  { value: 'design', icon: '🎨', label: '디자인' },
  { value: 'self-development', icon: '🧭', label: '자기계발' },
];

export default function CreateLesson() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const uid = authUser?.uid;

  // Local form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [cost, setCost] = useState(5);
  const [startTime, setStartTime] = useState(''); // yyyy-MM-ddThh:mm
  const [sessionType, setSessionType] = useState('in-person');
  const [difficulty, setDifficulty] = useState('beginner');
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState("programming");

  // Minimal validation example
  const [error, setError] = useState('');

  const handleTags = useCallback((selected) => {
    setTags(selected);
  }, [setTags]);

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!startTime) {
      setError('Please choose a start date/time.');
      return;
    }
    if (capacity < 1 || capacity > 30) {
      setError('Capacity must be between 1 and 30.');
      return;
    }
    if (cost < 1 || cost > 50) {
      setError('Cost must be between 1 and 50 points.');
      return;
    }
    if (!uid) {
      setError('User not recognized. Please log in again.');
      return;
    }

    try {
      // 1) Create the lesson under /lessons
      const lessonData = {
        title: title.trim(),
        description: description.trim(),
        teacherUid: uid,
        capacity: parseInt(capacity),
        cost: parseInt(cost),
        sessionType,
        difficulty,
        tags: tags.map((t) => t.value),
        category: category,
        open: true,
        startTime: new Date(startTime), // Firestore will store as timestamp
        createdAt: null // we'll rely on serverTimestamp() in the helper
      };

      // createLesson returns a DocumentReference
      const docRef = await createLesson(lessonData);
      const newLessonId = docRef.id;

      // 2) Create a "teaching" shortcut under /users/{uid}/teaching/{lessonId}
      await addTeachingShortcut(uid, newLessonId);

      // 3) (Optional) Redirect to Dash or details page
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save lesson:', err);
      setError('An error occurred saving your lesson. Try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0f0f5',
        fontFamily: '"Segoe UI", sans-serif'
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: '#3b3b98',
          color: '#fff',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Create New Lesson</h1>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1.2rem',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          Save Lesson
        </button>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem'
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            width: '100%',
            maxWidth: 600,
            padding: '2rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        >
          {error && (
            <div
              style={{
                backgroundColor: '#fddede',
                color: '#b71c1c',
                padding: '0.75rem',
                borderRadius: 4,
                marginBottom: '1rem'
              }}
            >
              {error}
            </div>
          )}

          {/* Lesson Title */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.3rem',
                color: '#333',
                fontSize: '0.9rem'
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.3rem',
                color: '#333',
                fontSize: '0.9rem'
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description…"
              style={{
                width: '100%',
                padding: '0.6rem',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: '1rem',
                minHeight: 100,
                resize: 'vertical'
              }}
            />
          </div>

          {/* Session Type & Difficulty && Tags */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                Session Type
              </label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1rem'
                }}
              >
                <option value="in-person">In-Person</option>
                <option value="online">Online</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1rem'
                }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                Tags
              </label>
              {/* <p>Selected: {tags.join(', ')}</p> */}
              <Select
                isMulti
                options={categories}
                value={tags}
                onChange={handleTags}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1rem'
                }}
              >
              </Select>
            </div>
          </div>

          {/* Capacity & Cost */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem'
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                Capacity (1–30)
              </label>
              <input
                type="number"
                value={capacity}
                onChange={e => setCapacity(Number(e.target.value))}
                min={1}
                max={30}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                Cost (1–50 pts)
              </label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(Number(e.target.value))}
                min={1}
                max={50}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: '#333',
                  fontSize: '0.9rem'
                }}
              >
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  fontSize: '1rem'
                }}
              >
              {
                categories.map((c, idx) => {
                  return <option key={c.value} value={c.value}>{c.label}</option>
                })
              }
              </select>
            </div>
          </div>

          {/* Start Time */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.3rem',
                color: '#333',
                fontSize: '0.9rem'
              }}
            >
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#777' }}>
              Must be at least 24 hours from now (enforced by your Firestore rules).
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
