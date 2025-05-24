import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div style={{ padding: '2rem', display: 'flex', gap: '10rem' }}>
      <div style={{ width: 200, textAlign: 'center' }}>
        <img src='profile.svg' style={{width: 120, height: 120}}/>
        <h3>{user.name}</h3>
        <p>Your points: </p>
        <button style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Create Lesson</button>
      </div>
      <div style={{ flex: 1 , display: "flex", flexDirection: "column"}}>
        <h2 style={{textAlign: "left"}}>Dashboard</h2>
        <div style={{display: "flex", justifyContent: "space-between", gap: "1rem"}}>
          <div style={{ flex: 1, border: "3px solid #dee2e6", padding: "0.5rem 3rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "3rem"}}>
              <p style={{ padding: 0}}>My Upcomming Lessons</p>
              <p>Lesson List</p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start", placeItems: "center", gap: "1rem"}}>
              <div style={{ width: 40, height: 40, border: "2px solid #dee2e6", borderRadius: "1rem"}}><img src='go.svg' style={{width: 40, height: 40}}/></div>
              <p>React Basics – May 25, 16:00</p>
            </div>
          </div>
          <div style={{ flex: 1, border: "3px solid #dee2e6", padding: "0.5rem 3rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "3rem"}}>
                <p style={{ padding: 0}}>My Lessons</p>
                <p>Lesson List</p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", placeItems: "center", gap: "1rem"}}>
                <div style={{ width: 40, height: 40, border: "2px solid #dee2e6", borderRadius: "1rem"}}><img src='go.svg' style={{width: 40, height: 40}}/></div>
                <p>Title</p>
              </div>
            </div>
        </div>
        <h2>Edit Profile</h2>
        <p>[Profile form here]</p>
      </div>
    </div>
  );
}
