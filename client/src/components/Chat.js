// client/src/components/Chat.js
import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { FiSend, FiUser } from 'react-icons/fi';
import { BiRefresh } from 'react-icons/bi';

import '../index.css';

const SOCKET_URL = 'http://localhost:5000';
const API_URL = 'http://localhost:5000/api/messages';
const socket = io(SOCKET_URL);

export default function Chat() {
  const [name, setName] = useState('Guest' + Math.floor(Math.random() * 1000));
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(API_URL);
        setMessages(res.data || []);
      } catch (err) {
        console.error('Could not load messages', err);
      }
    };
    fetchMessages();

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    return () => socket.off('new-message');
  }, []);

  useEffect(() => {
    // auto scroll to bottom when messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const payload = { user: name, text };
    socket.emit('send-message', payload);
    setText('');
  };

  const refreshMessages = async () => {
    try {
      const res = await axios.get(API_URL);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app">
      <div className="header"><h1>MERN Chat (Socket.IO)</h1></div>
      <div className="chat-wrap">
        <div className="top-row">
          <div className="left">
            <FiUser size={18} style={{opacity:0.85}} />
            <label style={{fontWeight:600}}>Your name:</label>
            <input className="name-input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <button title="Reload messages" onClick={refreshMessages} style={{border:'none',background:'transparent',cursor:'pointer'}}><BiRefresh size={20} /></button>
          </div>
        </div>

        <div className="messages" ref={messagesRef}>
          {messages.map(m => (
            <div className="msg" key={m._id || (m.createdAt + m.user)}>
              <div className="meta">
                {m.user}
                <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="bubble">{m.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} className="input-row">
          <input
            className="text-input"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
          />
          <button type="submit" className="icon-btn"><FiSend size={18} /> Send</button>
        </form>
      </div>
    </div>
  );
}
