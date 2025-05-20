import React from 'react';
import { useParams } from 'react-router-dom';

export default function LessonDetails() {
  const { id } = useParams();
  return (
    <div style={{ background: '#111', color: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <h1>Lesson Details</h1>
      <p><strong>ID:</strong> {id}</p>
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
        <div style={{ flex: 2 }}>
          <div style={{ height: 200, background: '#333', borderRadius: 4 }} /> {/* thumbnail */}
          <h2 style={{ marginTop: '1rem' }}>Course Title</h2>
          <p>Description goes here…</p>
          <button style={{ padding: '0.5rem 1rem' }}>Send Message to Tutor</button>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Reviews</h3>
          <div style={{ background: '#222', padding: '1rem', borderRadius: 4, marginBottom: '1rem' }}>
            <strong>Student A</strong><br />
            ★★★★★
            <p>Great lesson!</p>
          </div>
          <div style={{ background: '#222', padding: '1rem', borderRadius: 4 }}>
            <strong>Student B</strong><br />
            ★★★★☆
            <p>Very clear.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
