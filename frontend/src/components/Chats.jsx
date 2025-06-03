// src/components/Chats.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchUsers,
  sendMessage,
  startChat,
  viewChats,
  viewMessages
} from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Chats() {
  const { user: authUser } = useAuth();
  const uid = authUser?.uid;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [activeConvo, setActiveConvo] = useState(null);
  const [courseTitle, setCourseTitle] = useState(''); // <-- new state
  const [inputText, setInputText] = useState('');
  const [fileToSend, setFileToSend] = useState(null);
  const bottomRef = useRef();

  // Load conversations and messages
  const load = useCallback(async () => {
    if (!uid) return;

    // 1) Get all chat docs where this user is a member
    const result = await viewChats(uid);
    const memberParam = searchParams.get('member');
    const needsNewChat = memberParam && result.every(r => !r.members.includes(memberParam));

    // 2) Fetch all users once
    const userSnapshots = await fetchUsers();
    const users = userSnapshots.docs.map(s => ({ id: s.id, ...s.data() }));

    // 3) Attach name, avatar, other UID, lessonId, messages, lastMessage, time
    for (let chat of result) {
      const otherUid = chat.members.find(m => m !== uid);
      const userInfo = users.find(u => u.id === otherUid) || {};
      chat.name = userInfo.displayName || 'Unknown';
      chat.avatar = userInfo.photoURL || '/assets/profile-placeholder.png';
      chat.other = otherUid;

      // Assume each chat document has a `lessonId` field
      // (set when calling startChat with a lesson context)
      // If missing, ignore
      if (chat.lessonId) {
        // Fetch the lesson title
        const lessonSnap = await getDoc(doc(db, 'lessons', chat.lessonId));
        if (lessonSnap.exists()) {
          chat.course = lessonSnap.data().title;
        } else {
          chat.course = 'Unknown Course';
        }
      } else {
        chat.course = '';
      }

      // Fetch all messages for this chat
      chat.messages = await viewMessages(chat.id);
      // Determine last message and timestamp
      if (chat.messages.length) {
        const last = chat.messages[chat.messages.length - 1];
        chat.lastMessage = last.text.startsWith('📷') ? 'Sent a photo' : last.text;
        chat.time = last.time;
      } else {
        chat.lastMessage = '';
        chat.time = '';
      }
    }

    // 4) If directed to a specific member, start new chat if needed
    if (needsNewChat) {
      // If creating a new chat from a lesson page, pass that lessonId as second argument
      const lessonParam = searchParams.get('lessonId') || '';
      const newChatId = await startChat(uid, memberParam, lessonParam); // modified helper signature
      setActiveId(newChatId);
    } else if (memberParam) {
      const existing = result.find(r => r.members.includes(memberParam));
      setActiveId(existing.id);
    }

    setConvos(result);
  }, [searchParams, uid]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const convo = convos.find(c => c.id === activeId) || null;
    setActiveConvo(convo);

    // When active chat changes, update the displayed course title
    if (convo && convo.course) {
      setCourseTitle(convo.course);
    } else {
      setCourseTitle('');
    }
  }, [convos, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo?.messages]);

  const handleSend = async e => {
    e.preventDefault();
    if (!activeConvo) return;

    let content = inputText.trim();
    if (fileToSend) {
      content = '📷 ' + fileToSend.name;
      // In a real app, upload to Firebase Storage, then send the URL
      setFileToSend(null);
    }
    if (!content) return;

    setInputText('');
    await sendMessage(activeConvo.id, uid, content);
    await load();
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: 280,
        background: '#1e1e1e',
        color: '#fff',
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '1rem',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          textAlign: 'center',
          borderBottom: '1px solid #333'
        }}>
          SkillSwap Chats
        </div>
        {convos.map(c => (
          <div
            key={c.id}
            onClick={() => setActiveId(c.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: c.id === activeId ? '#333' : 'transparent',
              cursor: 'pointer',
              borderBottom: '1px solid #2a2a2a'
            }}
          >
            <img
              src={c.avatar}
              alt={c.name}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                marginRight: '0.75rem',
                objectFit: 'cover',
                border: '2px solid #555'
              }}
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {c.name}
              </div>
              <div style={{
                fontSize: 12,
                color: '#aaa',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {c.lastMessage}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#777', marginLeft: '0.5rem' }}>
              {c.time}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#f9f9f9'
      }}>
        {/* Header */}
        <div style={{
          padding: '0.75rem 1rem',
          background: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              marginRight: '0.75rem',
              color: '#333'
            }}
          >
            ←
          </button>
          {activeConvo ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img
                src={activeConvo.avatar}
                alt={activeConvo.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  marginRight: '0.75rem',
                  objectFit: 'cover',
                  border: '2px solid #ccc'
                }}
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#222' }}>
                  {activeConvo.name}
                  {courseTitle && (
                    <span style={{ fontSize: 12, color: '#555', marginLeft: '0.5rem' }}>
                      ({courseTitle})
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>Online</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 16, color: '#555' }}>Select a chat</div>
          )}
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          background: '#eaeaea'
        }}>
          {activeConvo && activeConvo.messages.map((m, idx) => {
            const isMe = m.authorUid === uid;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  marginBottom: '0.75rem'
                }}
              >
                {!isMe && (
                  <img
                    src={activeConvo.avatar}
                    alt={m.author}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      marginRight: '0.5rem',
                      objectFit: 'cover',
                      border: '1px solid #ccc'
                    }}
                  />
                )}
                <div style={{
                  maxWidth: '65%',
                  background: isMe ? '#333' : '#fff',
                  color: isMe ? '#fff' : '#222',
                  padding: '0.75rem',
                  borderRadius: 12,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  wordWrap: 'break-word',
                  position: 'relative'
                }}>
                  {m.text.startsWith('📷') ? (
                    <em style={{ color: isMe ? '#ddd' : '#555' }}>
                      Sent a photo: {m.text.slice(2)}
                    </em>
                  ) : (
                    m.text
                  )}
                  <div style={{
                    fontSize: 10,
                    color: isMe ? '#aaa' : '#888',
                    marginTop: 4,
                    textAlign: 'right'
                  }}>
                    {m.time}
                  </div>
                </div>
                {isMe && <div style={{ width: 32, height: 32, marginLeft: '0.5rem' }} />}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex',
            padding: '0.5rem 1rem',
            background: '#fff',
            borderTop: '1px solid #ddd',
            alignItems: 'center'
          }}
        >
          <button
            type="button"
            onClick={() => document.getElementById('fileInput').click()}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              marginRight: '0.5rem',
              color: '#555'
            }}
          >
            📷
          </button>
          <input
            id="fileInput"
            type="file"
            style={{ display: 'none' }}
            onChange={e => setFileToSend(e.target.files[0])}
          />
          {fileToSend && (
            <span style={{ marginRight: '0.75rem', fontSize: 12, color: '#555' }}>
              {fileToSend.name}
            </span>
          )}
          <input
            type="text"
            placeholder="Type a message"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 20,
              border: '1px solid #ccc',
              marginRight: '0.5rem',
              fontSize: '1rem'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0 1rem',
              background: '#333',
              border: 'none',
              borderRadius: 20,
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
