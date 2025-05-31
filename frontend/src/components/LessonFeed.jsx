// src/components/LessonFeed.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryNav from '../components/CategoryNav';
import { watchLessons } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';

export default function LessonFeed() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [sortMode, setSortMode] = useState('startTime'); 
  const [selectedTag, setSelectedTag] = useState('전체');
  // You can sort by 'startTime' or by 'cost' or any other numeric field.

  useEffect(() => {
    // Subscribe in real‐time to the /lessons collection, ordered by createdAt (descending)
    const unsubscribe = watchLessons((snapshot) => {
      const arr = [];
      snapshot.forEach((docSnap) => {
        arr.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLessons(arr);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  const filteredLessons = selectedTag && selectedTag !== '전체'
    ? lessons.filter(l => l.tag?.includes(selectedTag))
    : lessons;

  // Sort logic: by startTime (soonest first) or by cost (lowest first)
  const sortedLessons = [...filteredLessons].sort((a, b) => {
    if (sortMode === 'startTime') {
      // Both a.startTime and b.startTime are Firestore Timestamp objects
      const ta = a.startTime instanceof Timestamp 
        ? a.startTime.seconds 
        : 0;
      const tb = b.startTime instanceof Timestamp 
        ? b.startTime.seconds 
        : 0;
      return ta - tb; // ascending: earliest start first
    }
    if (sortMode === 'cost') {
      return (a.cost ?? 0) - (b.cost ?? 0); // ascending: cheapest first
    }
    return 0;
  });

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <CategoryNav selected={selectedTag} setSelected={setSelectedTag} />

        {/**
         * ─── Top Filter / Sort Section ─────────────────────────────────────────
         */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img
                src="src/assets/filter_icon.png"
                alt="Filter"
                style={{ width: '20px', height: '20px' }}
              />
              <strong>Filter</strong>
            </span>

            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
              style={{
                padding: '0.3rem 0.5rem',
                fontSize: '1rem',
                borderRadius: '6px',
                border: '1px solid #ccc'
              }}
            >
              <option value="startTime">Sort by Start Time</option>
              <option value="cost">Sort by Cost</option>
            </select>
          </div>
        </div>

        {/**
         * ─── Lesson Card Grid ───────────────────────────────────────────────────
         */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {sortedLessons.map((lesson) => {
            // Format startTime as YYYY-MM-DD or localized string
            let formattedDate = '';
            if (lesson.startTime instanceof Timestamp) {
              formattedDate = new Date(
                lesson.startTime.seconds * 1000
              ).toLocaleDateString();
            } else if (lesson.startTime instanceof Date) {
              formattedDate = lesson.startTime.toLocaleDateString();
            }

            return (
              <div
                key={lesson.id}
                onClick={() => navigate(`/lesson/${lesson.id}`)}
                style={{
                  background: '#f9f9f9',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  border: '1px solid #eeeeee',
                  transition: 'transform 0.2s',
                  paddingBottom: '0.5rem',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {/**
                 * Thumbnail area (gray placeholder)
                 */}
                <div style={{ height: '140px', backgroundColor: '#dddddd' }} />

                {/**
                 * Card content
                 */}
                <div style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#333333' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {lesson.title}
                  </div>
                  <div style={{ marginBottom: '0.25rem', color: '#555555' }}>
                    {lesson.teacherUid}
                  </div>
                  {formattedDate && (
                    <div style={{ marginBottom: '0.25rem', color: '#777777', fontSize: '0.85rem' }}>
                      Start Date: {formattedDate}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#666666' }}>
                    <span>💰 {lesson.cost} pts</span>
                    <span>👥 Capacity: {lesson.capacity}</span>
                    <span>📡 {lesson.sessionType}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888888' }}>
                    Difficulty: {lesson.difficulty}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/**
         * ─── Simple Pagination UI ────────────────────────────────────────────────
         */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '2rem',
            gap: '0.5rem'
          }}
        >
          <button
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: '#00b77e',
              color: '#ffffff',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            1
          </button>
          <button
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: '#f1f1f1',
              color: '#333333',
              border: 'none',
              cursor: 'pointer'
            }}
            onClick={() => {
              // Future: implement next‐page logic if you fetch in pages
            }}
          >
            {'>'}
          </button>
        </div>
      </div>
    </div>
  );
}