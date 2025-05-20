import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLessons, onLessonsSnapshot } from '../services/firebase';

export default function LessonFeed() {
  const [lessons, setLessons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons().then(snapshot =>
      setLessons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubscribe = onLessonsSnapshot(snapshot =>
      setLessons(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsubscribe;
  }, []);

  return (
    <div style={{ background: '#111', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1>Lesson Feed</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        {lessons.map(lesson => (
          <div
            key={lesson.id}
            onClick={() => navigate(`/lesson/${lesson.id}`)}
            style={{ background: '#222', borderRadius: 4, cursor: 'pointer', overflow: 'hidden' }}
          >
            <div style={{ height: 100, background: '#444' }} />
            <div style={{ padding: '0.5rem', fontSize: 14 }}>
              <strong>{lesson.title}</strong><br />
              <span>{lesson.author}</span><br />
              <span style={{ color: '#ffd700' }}>★ {lesson.rating?.toFixed(1) ?? '0.0'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}