import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import './Chat.css';

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, user:users(name)')
      .order('created_at', { ascending: true });

    if (error) {
      setError('Fehler beim Laden der Nachrichten.');
      setMessages([]);
    } else {
      setMessages(data);
      scrollToBottom();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();

    const channel = supabase.channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        setMessages(prevMessages => [...prevMessages, payload.new]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('chat_messages').insert([
      { content: newMessage, user_id: user.id }
    ]);

    if (error) {
      setError('Fehler beim Senden der Nachricht.');
    } else {
      setNewMessage('');
    }
  };

  const formatMessage = (text) => {
    // Replace @mentions with styled spans
    let formattedText = text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    // Replace #tabs with styled links (without actual navigation)
    formattedText = formattedText.replace(/#(\w+)/g, '<span class="tab-link">#$1</span>');
    return formattedText;
  };

  return (
    <div className="chat-container">
      <div className="message-list">
        {loading && <p>Lade Nachrichten...</p>}
        {error && <p className="error-message">{error}</p>}
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.user_id === user.id ? 'sent' : 'received'}`}>
            <div className="message-bubble">
              <span className="user-name">{msg.user.name}</span>
              <p dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}></p>
              <span className="timestamp">{new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Nachricht schreiben..."
        />
        <button type="submit">Senden</button>
      </form>
    </div>
  );
}
