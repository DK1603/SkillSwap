import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '2rem' }}>
      <div style={{ width: 200, textAlign: 'center' }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#ddd', margin: '0 auto' }} />
        <h3>{user.name}</h3>
        <button style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Create Lesson</button>
      </div>
      <div style={{ flex: 1 }}>
        <h2>My Upcoming Lessons</h2>
        <ul>
          <li>React Basics – May 25, 16:00</li>
        </ul>
        <h2>Edit Profile</h2>
        <p>[Profile form here]</p>
      </div>
    </div>
  );
}
