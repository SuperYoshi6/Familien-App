import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import './AdminPanel.css';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, name, is_admin')
      .order('name', { ascending: true });

    if (error) {
      setError('Fehler beim Laden der Benutzer.');
      setUsers([]);
    } else {
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!editingUser || !newPassword) return;

    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', editingUser.id);

    if (error) {
      setError('Fehler beim Zurücksetzen des Passworts.');
      setSuccessMessage('');
    } else {
      setSuccessMessage(`Passwort für ${editingUser.name} wurde erfolgreich geändert.`);
      setEditingUser(null);
      setNewPassword('');
      setError(null);
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setNewPassword('');
    setError(null);
    setSuccessMessage('');
  };

  if (loading) {
    return <p>Lade Benutzerliste...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="admin-panel-container">
      <h2>Benutzerverwaltung</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      <ul className="user-list">
        {users.map(user => (
          <li key={user.id} className="user-item">
            <span className="user-name">{user.name} {user.is_admin && '(Admin)'}</span>
            <button onClick={() => startEditing(user)} disabled={user.is_admin}>
              Passwort zurücksetzen
            </button>
          </li>
        ))}
      </ul>

      {editingUser && (
        <div className="password-reset-form">
          <h3>Passwort für {editingUser.name} ändern</h3>
          <form onSubmit={handlePasswordReset}>
            <input
              type="text"
              placeholder="Neues Passwort"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <div className="form-actions">
              <button type="button" onClick={() => setEditingUser(null)}>Abbrechen</button>
              <button type="submit">Speichern</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
