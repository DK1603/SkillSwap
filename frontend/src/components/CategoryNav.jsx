import React from 'react';

// key값 변경
const categories = [
  { key: '전체', icon: '🗂️', label: '전체' },
  { key: '프로그래밍', icon: '💻', label: '개발·프로그래밍' },
  { key: '게임', icon: '🎮', label: '게임 개발' },
  { key: '경제', icon: '💰', label: '경제' },
  { key: '요리', icon: '🍳', label: '요리' },
  { key: '디자인', icon: '🎨', label: '디자인' },
  { key: '자기계발', icon: '🧭', label: '자기계발' },
];

export default function CategoryNav({ selected, setSelected }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      gap: '0.5rem',
      marginTop: '-1rem',
      borderBottom: '1px solid #eee',
      marginBottom: '1rem' // 필터와의 간격 생성
    }}>
      {categories.map((cat) => (
        <div
          key={cat.key}
          onClick={() => setSelected(cat.key)}
          style={{
            width: '80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            color: selected === cat.key ? '#000' : '#666',
            fontWeight: selected === cat.key ? 'bold' : 'normal',
            borderBottom: selected === cat.key ? '2px solid #00b77e' : '2px solid transparent',
            paddingBottom: '0.25rem',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{cat.icon}</div>
          <div style={{ fontSize: ['프로그래밍', '게임'].includes(cat.key) ? '0.75rem' : '0.85rem' }}>
              {cat.label}
          </div>
        </div>
      ))}
    </div>
  );
}