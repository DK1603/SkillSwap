import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ padding: '1rem', background: '#222', color: '#fff', display: 'flex', gap: '1rem' }}>
      <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Lessons</Link>
      {user ? (
        <>
          <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Profile</Link>
          <Link to="/chats" style={{ color: '#fff', textDecoration: 'none' }}>Chats</Link>
          <button onClick={logout} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#fff' }}>Logout</button>
        </>
      ) : (
        <Link to="/login" style={{ marginLeft: 'auto', color: '#fff', textDecoration: 'none' }}>Login</Link>
      )}
    </nav>
  );
}