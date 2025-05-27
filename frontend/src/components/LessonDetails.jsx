import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const lessonMap = {
  1: {
    title: 'Python 101',
    description: '이 강의는 Python의 기초를 다룹니다.',
    teacher: '홍길동',
    rating: 5.0,
    tags: ['기초', 'Python'],
    cost: 300,
    lec_hrs: 5,
    form: '오프라인',
    chapters: [
      { title: '챕터 1. 기초 문법', lessons: ['1. 변수와 자료형'] },
      { title: '챕터 2. 제어문', lessons: ['1. 조건문', '2. 반복문', '3. 실습 예제'] }
    ],
    reviews: [
      { name: 'Anon 1', date: '2024/12/8', stars: '★★★★★', text: 'Not bad' },
      { name: 'Anon 2', date: '2024/12/17', stars: '★★★★★', text: 'Quite simple' }
    ],
    categories: [
      'Fundamental', 
      'Programming',
    ],

    registered: 8,
    space: 10

  },
  2: {
    title: 'C++ 203',
    description: 'C++ 기초수업 입니다',
    teacher: '이몽룡',
    rating: 4.5,
    tags: ['중급', 'C++'],
    cost: 500,
    form: '오프라인',
    lec_hrs: 8,
    chapters: [
      { title: '챕터 1. 포인터 기초', lessons: ['1. 주소와 참조', '2. 포인터 연산'] },
      { title: '챕터 2. 클래스', lessons: ['1. 캡슐화', '2. 상속'] }
    ],
    reviews: [
      { name: 'Anon 1', date: '2024/12/2', stars: '★★★★★', text: 'Great!' },
      { name: 'Anon 2', date: '2024/12/21', stars: '★★★★', text: 'Hard but rewarding.' }
    ],
    categories: [
      'Fundamental', 
      'Programming',
    ],

    registered: 7,
    space: 15
  },
  3: {
    title: 'Java Basic',
    description: 'Java 프로그램밍 기초',
    teacher: '이해곤',
    rating: 2.0,
    tags: ['중급', 'Java'],
    cost: 800,
    form: '온라인',
    lec_hrs: 7,
    chapters: [
      { title: '챕터 1. 문법 기초', lessons: ['1. 변수와 자료형'] },
      { title: '챕터 2. 클래스', lessons: ['1. 캡슐화', '2. 상속'] }
    ],
    reviews: [
      { name: 'Anon 1', date: '2024/12/30', stars: '★', text: 'I regret for taking this.' },
      { name: 'Anon 2', date: '2024/12/23', stars: '★★★', text: 'You\'re not going to like it.' }
    ],
    categories: [
      'Intermediate', 
      'Programming',
    ],

    registered: 0,
    space: 20
  }
};

export default function LessonDetails() {
  const { id } = useParams();
  const lesson = lessonMap[id];
  const [enrolled, setEnrolled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [points, setPoints] = useState(1000);

  if (!lesson) {
    return <div style={{ color: 'white', padding: '2rem' }}>해당 강의를 찾을 수 없습니다.</div>;
  }

  const handleEnroll = () => {
    if (points >= lesson.cost) {
      setPoints(points - lesson.cost);
      setEnrolled(true);
      setShowConfirm(false);
      alert('수강 신청이 완료되었습니다!');
    } else {
      alert('포인트가 부족합니다.');
    }
  };

  return (
    <div style={{ background: '#f9f9f9', color: '#000', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', padding: '2rem', background: '#000', color: '#fff' }}>
        <div style={{ flex: 2 }}>
          <h1>{lesson.title}</h1>
          <p>{lesson.description}</p>
          <p>👁 {lesson.registered}({lesson.space})명이 수강하고 있어요.</p>
          <p>👨‍🏫 Teacher: {lesson.teacher} ⭐ {lesson.rating}</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {lesson.tags.map((tag, i) => (
              <span key={i} style={{ background: '#444', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '1rem', fontSize: '0.8rem' }}>#{tag}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: '100%', height: 200, background: '#ccc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Thumbnail</div>
        </div>
      </div>

      <div style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
        {/* Left info box */}
        <div style={{ flex: 1, background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #ddd' }}>
          <table style={{ width: '100%', fontSize: '0.9rem', marginBottom: '1rem' }}>
            <tbody>
              <tr><td>Teacher</td><td>{lesson.teacher}</td></tr>
              <tr><td>강의 수</td><td>{lesson.chapters.length} 차시</td></tr>
              <tr><td>강의 시간</td><td>{lesson.lec_hrs} 시간</td></tr>
              <tr><td>장소</td><td>{lesson.form}</td></tr>
              <tr><td>Cost</td><td>{lesson.cost}pts</td></tr>
              <tr><td>Skill</td><td>{lesson.tags.map(tag => <span key={tag} style={{ background: '#eee', padding: '2px 8px', borderRadius: 12, marginRight: 6 }}>#{tag}</span>)}</td></tr>
            </tbody>
          </table>
          {!enrolled ? (
            <button onClick={() => setShowConfirm(true)} style={{ width: '100%', background: '#00b77e', color: '#fff', padding: '0.75rem', border: 'none', borderRadius: 6 }}>수강하기</button>
          ) : (
            <button disabled style={{ width: '100%', background: '#ccc', color: '#666', padding: '0.75rem', border: 'none', borderRadius: 6 }}>수강중</button>
          )}
        </div>

        {/* Center Curriculum */}
        <div style={{ flex: 2 }}>
          {lesson.chapters.map((ch, idx) => (
            <details key={idx} style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem', border: '1px solid #ddd' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>{ch.title}</summary>
              <ul style={{ paddingLeft: '1rem' }}>
                {ch.lessons.map((lsn, i) => (
                  <li key={i} style={{ marginTop: 6 }}>{lsn}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>

        {/* Right reviews */}
        <div style={{ flex: 1 }}>
          {lesson.reviews.map((r, i) => (
            <div key={i} style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #ddd', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 40, height: 40, background: '#ccc', borderRadius: '50%' }}></div>
                <div>
                  <strong>{r.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{r.date}</div>
                </div>
              </div>
              <div style={{ color: '#f5c518', marginTop: '0.5rem', textAlign: 'left' }}>{r.stars}</div>
              {r.text.split('\n').map((line, i) => <p key={i} style={{ marginTop: 6, textAlign: 'left' }}>{line}</p>)}
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 8, width: 300, textAlign: 'center' }}>
            <h3>수강 확인</h3>
            <p>현재 포인트: {points} pt</p>
            <p>수강 후 남는 포인트: {points - lesson.cost} pt</p>
            <button onClick={handleEnroll} style={{ marginTop: '1rem', background: '#00b77e', color: '#fff', padding: '0.5rem 1rem', border: 'none', borderRadius: 6 }}>수강 확인</button>
            <button onClick={() => setShowConfirm(false)} style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}
