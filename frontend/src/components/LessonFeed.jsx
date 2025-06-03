// src/components/LessonFeed.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryNav from '../components/CategoryNav';
import { watchLessons, getUserDisplayName, calculateAverageRating } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';

export default function LessonFeed() {
  const navigate = useNavigate();
  // const [lessonsW, setLessons] = useState([]);
  const [sortMode, setSortMode] = useState('startTime');
  const [selectedTag, setSelectedTag] = useState('all');
  const [lessonsWithTeachers, setLessonsWithTeachers] = useState([]);
  // You can sort by 'startTime' or by 'cost' or any other numeric field.

  useEffect(() => {
    // Subscribe in real‐time to the /lessons collection, ordered by createdAt (descending)
    const unsubscribe = watchLessons(async (snapshot) => {
      const arr = [];
      for (const docSnap of snapshot.docs) {
        const lesson = docSnap.data();
        const teacherName = await getUserDisplayName(lesson.teacherUid);
        const rating = await calculateAverageRating(docSnap.id);
        arr.push({ id: docSnap.id, ...lesson, teacherName, rating });
      }
      setLessonsWithTeachers(arr);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  const filteredLessons = selectedTag && selectedTag !== 'all'
    ? lessonsWithTeachers.filter(l => l.category === selectedTag)
    : lessonsWithTeachers;

  // Sort logic: by startTime (soonest first) or by cost (lowest first)
  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const ta = a.startTime instanceof Timestamp ? a.startTime.seconds : 0;
    const tb = b.startTime instanceof Timestamp ? b.startTime.seconds : 0;
    const ca = a.cost ?? 0;
    const cb = b.cost ?? 0;
    const ra = a.rating ?? 0;
    const rb = b.rating ?? 0;
    const ea = a.enrolledCount ?? 0;
    const eb = b.enrolledCount ?? 0;

    switch (sortMode) {
      case 'ratingHigh':
        return rb - ra; // 평점 높은 순
      // case 'enrollmentHigh':
      //   return eb - ea; // 등록자 많은 순
      case 'costLow':
        return ca - cb; // 가격 낮은 순
      case 'startSoon':
        return ta - tb; // 시작 시간 빠른 순
      default:
        return 0;
    }
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
              <option value="startSoon">Start Time</option>
              <option value="ratingHigh">Rating</option>
              {/* <option value="enrollmentHigh">Enrolled</option> */}
              <option value="costLow">Cost</option>
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
                {(lesson?.thumbnailURL ?? "").trim() === "" ?
                  <div style={{ height: '140px', backgroundColor: '#dddddd' }} /> :
                  <img
                    src={lesson.thumbnailURL || '/assets/profile-placeholder.png'}
                    alt="thumbnail"
                    style={{ width: "100%", height: '140px', borderRadius: 8, objectFit: 'cover', marginBottom: '0.5rem' }}
                  />
                }

                {/**
                 * Card content
                 */}
                <div style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#333333' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {lesson.title}
                  </div>
                  <div style={{ marginBottom: '0.25rem', color: '#555555' }}>
                    {lesson.teacherName}
                  </div>
                  {formattedDate && (
                    <div style={{ marginBottom: '0.25rem', color: '#777777', fontSize: '0.85rem' }}>
                      Start Date: {formattedDate}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#666666' }}>
                    <span>💰 {lesson.cost} pts</span>
                    <span>👥 Capacity: {lesson.capacity}</span>
                    <span>
                      {lesson.sessionType === 'in-person' ? '🏫' : '🧑‍💻'} {lesson.sessionType}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#888888' }}>
                    Difficulty: {lesson.difficulty}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#ffaa00' }}>
                    ⭐ {lesson.rating} / 5
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