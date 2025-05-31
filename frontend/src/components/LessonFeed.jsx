import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryNav from '../components/CategoryNav';

export default function LessonFeed() {
  const navigate = useNavigate();
  const staticLessons = [
    { id: '1', title: 'Python 101', author: '홍길동', rating: 4.5, students: 13300, tags: ['프로그래밍'] },
    { id: '2', title: 'C++ 203', author: '이몽룡', rating: 3.9, students: 10200, tags: ['프로그래밍'] },
    { id: '3', title: 'Java Basic', author: '이해곤', rating: 2.0, students: 5, tags: ['프로그래밍'] },
    { id: '4', title: 'How to Cook Pasta', author: '이연복', rating: 5.0, students: 50, tags: ['요리'] },
  ];

  const [lessons] = useState(staticLessons);
  const [sortMode, setSortMode] = useState('rating');
  const [selectedTag, setSelectedTag] = useState(null);

  const sortedLessons = [...lessons].sort((a, b) => {
    if (sortMode === 'rating') return b.rating - a.rating;
    if (sortMode === 'students') return b.students - a.students;
    return 0;
  });

const filteredLessons = selectedTag && selectedTag !== '전체'
  ? sortedLessons.filter(l => l.tags?.includes(selectedTag))
  : sortedLessons;

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <CategoryNav selected={selectedTag} setSelected={setSelectedTag} />

        {/* 상단 정렬 옵션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="src/assets/filter_icon.png" alt="filter" style={{ width: '20px', height: '20px' }} />
              <strong>필터</strong>
            </span>
            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '1rem', borderRadius: '6px' }}>
              <option value="rating">평점순</option>
              <option value="students">인기순</option>
            </select>
          </div>
        </div>

        {/* 강의 카드 리스트 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredLessons.map(lesson => (
            <div
              key={lesson.id}
              onClick={() => navigate(`/lesson/${lesson.id}`)}
              style={{
                background: '#f9f9f9',
                borderRadius: '12px',
                cursor: 'pointer',
                overflow: 'hidden',
                border: '1px solid #eee',
                transition: 'transform 0.2s',
                paddingBottom: '0.5rem',
                textAlign: 'left',
              }}
            >
              <div style={{ height: '140px', backgroundColor: '#ddd' }} />
              <div style={{ padding: '0.75rem', fontSize: '0.9rem', color: '#333' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>{lesson.title}</div>
                <div style={{ marginBottom: '0.25rem', color: '#555' }}>{lesson.author}</div>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                  <span>⭐ {lesson.rating.toFixed(1)} (86)</span>
                  <span>👤 {lesson.students.toLocaleString()}+</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '0.5rem' }}>
          {[1].map(num => (
            <button key={num} style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: num === 1 ? '#00b77e' : '#f1f1f1',
              color: num === 1 ? '#fff' : '#333',
              border: 'none',
              fontWeight: 'bold'
            }}>{num}</button>
          ))}
          <button style={{ padding: '0.5rem 0.75rem' }}>{'>'}</button>
        </div>
      </div>
    </div>
  );
}