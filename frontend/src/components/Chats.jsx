import React, { useState, useRef, useEffect } from 'react';

const sampleConversations = [
  {
    id: 1,
    name: 'John Faustino',
    avatar: '/avatars/john.jpg',
    lastMessage: 'Got the files?',
    time: '52m',
    messages: [
      { author: 'John Faustino', text: 'Hey, did you get the report?', time: '10:12' },
      { author: 'You', text: 'Almost done, sending in 5.', time: '10:14' },
      { author: 'John Faustino', text: 'Perfect, thanks!', time: '10:15' },
    ],
  },
  {
    id: 2,
    name: 'Cassia Tofano',
    avatar: '/avatars/cassia.jpg',
    lastMessage: 'Let’s catch up later.',
    time: '1h',
    messages: [
      { author: 'Cassia Tofano', text: 'Up for coffee this afternoon?', time: '09:05' },
      { author: 'You', text: 'Sure—2 PM works for me.', time: '09:07' },
    ],
  },
  {
    id: 3,
    name: 'Youtong Lee',
    avatar: '/avatars/youtong.jpg',
    lastMessage: 'See you then!',
    time: '28m',
    messages: [
      { author: 'You', text: 'Don’t forget our meeting at 3.', time: '11:00' },
      { author: 'Youtong Lee', text: 'On my way!', time: '11:32' },
    ],
  },
];

export default function Chats() {
  const [convos] = useState(sampleConversations);
  const [activeId, setActiveId] = useState(convos[0].id);
  const [input, setInput] = useState('');
  const bottomRef = useRef();

  const activeConvo = convos.find(c => c.id === activeId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConvo.messages]);

  const handleSend = e => {
    e.preventDefault();
    if (!input.trim()) return;
    activeConvo.messages.push({ author: 'You', text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setInput('');
    // force update
    setInput(prev => prev);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 300, background: '#3C2C6C', color: '#fff', overflowY: 'auto' }}>
        <div style={{ padding: '1rem', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>
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
              background: c.id === activeId ? '#6930C3' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <img
              src={c.avatar}
              alt={c.name}
              style={{ width: 40, height: 40, borderRadius: '50%', marginRight: '0.75rem' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.lastMessage}
              </div>
            </div>
            <div style={{ fontSize: 12, marginLeft: '0.5rem', color: '#ccc' }}>{c.time}</div>
          </div>
        ))}
      </div>

      {/* Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F2F2F2' }}>
        {/* Header */}
        <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center' }}>
          <img
            src={activeConvo.avatar}
            alt={activeConvo.name}
            style={{ width: 48, height: 48, borderRadius: '50%', marginRight: '1rem' }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>{activeConvo.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>Online</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {activeConvo.messages.map((m, idx) => {
            const isMe = m.author === 'You';
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
                    style={{ width: 32, height: 32, borderRadius: '50%', marginRight: '0.5rem' }}
                  />
                )}
                <div style={{
                  maxWidth: '60%',
                  background: isMe ? '#0063dc' : '#fff',
                  color: isMe ? '#fff' : '#333',
                  padding: '0.75rem',
                  borderRadius: 8,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  {m.text}
                  <div style={{ fontSize: 10, color: isMe ? '#eee' : '#999', marginTop: 4, textAlign: 'right' }}>
                    {m.time}
                  </div>
                </div>
                {isMe && (
                  <div style={{ width: 32, height: 32, marginLeft: '0.5rem' }} />
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ display: 'flex', padding: '0.5rem 1rem', background: '#fff', borderTop: '1px solid #ddd' }}>
          <input
            type="text"
            placeholder="Type a message"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 4,
              border: '1px solid #ccc',
              marginRight: '0.5rem'
            }}
          />
          <button type="submit" style={{ padding: '0 1rem', background: '#0063dc', border: 'none', borderRadius: 4, color: '#fff' }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
