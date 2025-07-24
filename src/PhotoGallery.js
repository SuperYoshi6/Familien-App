import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNotifications } from './useNotifications';
import './PhotoGallery.css';

export default function PhotoGallery({ user }) {
  const { sendNotification } = useNotifications();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('photos').list();
    if (error) {
      setError('Fehler beim Laden der Fotos.');
      setPhotos([]);
    } else {
      const photoUrls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(file.name);
        return { ...file, publicUrl };
      });
      setPhotos(photoUrls);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, file);

    if (uploadError) {
      setError('Fehler beim Hochladen des Fotos.');
    } else {
      sendNotification('Neues Foto in der Galerie', {
        body: `${user.name} hat ein neues Foto hochgeladen.`,
      });
      fetchPhotos();
    }
  };

  return (
    <div className="photo-gallery-container">
      <h2>Fotogalerie</h2>
      <div className="upload-section">
        <label htmlFor="photo-upload" className="upload-button">Foto hochladen</label>
        <input id="photo-upload" type="file" onChange={handleUpload} accept="image/*" />
      </div>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Lade Fotos...</p>
      ) : (
        <div className="photo-grid">
          {photos.map(photo => (
            <div key={photo.id} className="photo-item">
              <img src={photo.publicUrl} alt="" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
