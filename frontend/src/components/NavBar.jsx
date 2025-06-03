// src/components/NavBar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      background: '#111', 
      color: '#fff', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0.75rem 1.5rem', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
    }}>
      {/* Brand */}
      <Link to="/" style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#fff',
        textDecoration: 'none',
        marginRight: '2rem'
      }}>
        SkillSwap
      </Link>

      {/* Left-side Links */}
      <div style={{ display: 'flex', gap: '1.25rem' }}>
        <Link to="/" style={linkStyle}>Lessons</Link>
        {user && <Link to="/dashboard" style={linkStyle}>Profile</Link>}
        {user && <Link to="/chats" style={linkStyle}>Chats</Link>}
      </div>

      {/* Right-side Actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid #555',
              color: '#fff',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'background 0.2s, border-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#333'}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#555';
            }}
          >
            Logout
          </button>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/signup" style={linkStyle}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

// Shared link style
const linkStyle = {
  color: '#ddd',
  textDecoration: 'none',
  fontSize: '1rem',
  padding: '0.4rem 0.6rem',
  borderRadius: '4px',
  transition: 'background 0.2s',
  whiteSpace: 'nowrap'
};

// When hovering over links
Object.assign(linkStyle, {
  cursor: 'pointer'
});

