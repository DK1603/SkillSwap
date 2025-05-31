// src/components/Signup.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '../services/firebase';

export default function Signup() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter an email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      // signUpWithEmail creates Auth user + /users/{uid} doc
      await signUpWithEmail(email.trim(), password, displayName.trim());
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      // You can inspect `err.code` to customize message (e.g. email-already-in-use)
      setError('Signup failed – maybe email is already registered.');
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '4rem auto',
        padding: '2rem',
        border: '1px solid #ccc',
        borderRadius: 4,
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
        />
        <input
          type="email"
          placeholder="email@skku.edu"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
        />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.5rem',
            backgroundColor: '#2980b9',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Create Account
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#2980b9', textDecoration: 'none' }}>
          Log in
        </a>
      </p>
    </div>
  );
}
