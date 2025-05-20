import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';
import LessonFeed from './components/LessonFeed';
import LessonDetails from './components/LessonDetails';
import Dashboard from './components/Dashboard';
import Chats from './components/Chats';
import Login from './components/Login';
import './App.css';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <Routes>
        <Route path="/" element={<LessonFeed />} />
        <Route path="/lesson/:id" element={<LessonDetails />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/chats"
          element={
            <Protected>
              <Chats />
            </Protected>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
