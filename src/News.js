import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNotifications } from './useNotifications';
import './News.css';

function NewsForm({ user, onNewPost }) {
  const { sendNotification } = useNotifications();
  const [form, setForm] = useState({ title: '', content: '', tags: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!form.title) return;

    setError(null);
    setUploading(true);

    let imageUrl = null;
    if (file) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(fileName, file);

      if (uploadError) {
        setError('Fehler beim Hochladen des Bildes.');
        setUploading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from('news-images')
        .getPublicUrl(fileName);
      imageUrl = urlData.publicUrl;
    }

    const tagsArray = form.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    const { error: insertError } = await supabase.from('news').insert([
      {
        title: form.title,
        content: form.content,
        tags: tagsArray,
        created_by: user.name,
        image_url: imageUrl,
      }
    ]);

    setUploading(false);
    if (insertError) {
      setError('Fehler beim Erstellen des Beitrags.');
    } else {
      sendNotification('Neuer News-Beitrag', {
        body: `Ein neuer Beitrag "${form.title}" wurde veröffentlicht.`,
      });
      setForm({ title: '', content: '', tags: '' });
      setFile(null);
      onNewPost(); // Callback, um das Formular zu schließen
    }
  };

  return (
    <form onSubmit={handleAddNews} className="add-news-form">
      <h3>Neuen Beitrag erstellen</h3>
      <input
        type="text"
        name="title"
        placeholder="Titel"
        value={form.title}
        onChange={handleInputChange}
        required
      />
      <textarea
        name="content"
        placeholder="Was gibt's Neues?"
        value={form.content}
        onChange={handleInputChange}
      />
      <input
        type="text"
        name="tags"
        placeholder="Tags (z.B. #update, #wichtig)"
        value={form.tags}
        onChange={handleInputChange}
      />
      <label htmlFor="image-upload" className="image-upload-label">
        {file ? `Bild: ${file.name}` : 'Bild auswählen'}
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Veröffentliche...' : 'Veröffentlichen'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  );
}

export default function News({ user }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString();

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .gt('expires_at', today)
      .order('created_at', { ascending: false });

    if (error) {
      setError('Fehler beim Laden der News.');
      setNews([]);
    } else {
      setNews(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNews();
    const channel = supabase.channel('news')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => fetchNews())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNews]);

  return (
    <div className="news-container">
      <div className="news-header-controls">
        <h2>News & Ankündigungen</h2>
        <button onClick={() => setShowForm(!showForm)} className="toggle-form-button">
          {showForm ? '×' : '+'}
        </button>
      </div>

      {showForm && <NewsForm user={user} onNewPost={() => { setShowForm(false); fetchNews(); }} />}

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Lade News...</p>
      ) : (
        <div className="news-list">
          {news.length === 0 && !showForm && <p className="empty-list">Keine aktuellen News vorhanden.</p>}
          {news.map(item => (
            <div key={item.id} className="news-item">
              {item.image_url && <img src={item.image_url} alt={item.title} className="news-image"/>}
              <div className="news-content">
                <h3>{item.title}</h3>
                <p>{item.content}</p>
                <div className="news-footer">
                  <div className="tags">
                    {item.tags && item.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="news-meta">
                    <span>von <strong>{item.created_by}</strong></span>
                    <span>am {new Date(item.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
