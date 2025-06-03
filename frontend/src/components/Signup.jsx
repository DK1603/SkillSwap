// src/components/Signup.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUpWithEmail } from '../services/firebase';

export default function Signup() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('❗ Please enter a display name.');
      return;
    }
    if (!email.trim()) {
      setError('❗ Please enter an email.');
      return;
    }
    if (password.length < 6) {
      setError('❗ Password must be at least 6 characters.');
      return;
    }

    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError('❌ Signup failed – maybe email already in use.');
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        background: '#111',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#1e1e1e',
          borderRadius: 8,
          padding: '1.5rem 1.25rem',
          boxShadow: '0 6px 18px rgba(0,0,0,0.6)',
          color: '#fff',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center'
        }}
      >
        {/* Header with guitar icon */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.25rem' }}>
            🎸
          </span>
          <h2 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: '0.5px' }}>
            SkillSwap Sign Up
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Display Name */}
          <label
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}
          >
            👤 Display Name
          </label>
          <input
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0rem 0.5rem 0.5rem',
              marginBottom: '0.8rem',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#2a2a2a',
              color: '#fff',
              fontSize: '0.95rem'
            }}
          />

          {/* Email */}
          <label
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}
          >
            📧 Email
          </label>
          <input
            type="email"
            placeholder="example@skku.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0rem 0.5rem 0.5rem',
              marginBottom: '0.8rem',
              borderRadius: 4,
              border: '1px solid #333',
              background: '#2a2a2a',
              color: '#fff',
              fontSize: '0.95rem'
            }}
          />

          {/* Password */}
          <label
            style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontSize: '0.9rem',
              textAlign: 'left'
            }}
          >
            🔒 Password
          </label>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 2rem 0.5rem 0.5rem',
                borderRadius: 4,
                border: '1px solid #333',
                background: '#2a2a2a',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={{
                position: 'absolute',
                top: '50%',
                right: '0.5rem',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: 0
              }}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.65rem',
              backgroundColor: '#2980b9',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1f6fa3')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2980b9')}
          >
             Create Account
          </button>
        </form>

        {error && (
          <p
            style={{
              color: '#e74c3c',
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </p>
        )}

        <p
          style={{
            marginTop: '1rem',
            fontSize: '0.9rem',
            textAlign: 'center',
            color: '#ccc'
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: '#2980b9',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
