import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './Auth.css';

// Komponente für die Registrierung
function Registration({ onRegister, setView }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prüfen, ob der Benutzer bereits existiert
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('name')
      .eq('name', name);

    if (fetchError || (existingUsers && existingUsers.length > 0)) {
      setError('Ein Benutzer mit diesem Namen existiert bereits.');
      setLoading(false);
      return;
    }

    // Neuen Benutzer anlegen (is_admin ist immer false bei Registrierung)
    const { data, error: insertError } = await supabase
      .from('users')
      .insert([{ name, password, is_admin: false }])
      .select()
      .single();

    setLoading(false);
    if (insertError) {
      setError('Registrierung fehlgeschlagen. Bitte erneut versuchen.');
    } else if (data) {
      onRegister(data); // Benutzer in App-State setzen
    }
  };

  return (
    <div className="auth-container">
      <h2>Registrieren</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Registriere...' : 'Registrieren'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
      <p className="toggle-view">
        Bereits registriert?{' '}
        <span onClick={() => setView('login')}>Zum Login</span>
      </p>
    </div>
  );
}

// Komponente für den Login
function Login({ onLogin, setView }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .eq('password', password)
      .single();

    setLoading(false);
    if (fetchError || !data) {
      setError('Name oder Passwort ist falsch.');
    } else {
      onLogin(data);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
      <p className="toggle-view">
        Noch kein Konto?{' '}
        <span onClick={() => setView('register')}>Jetzt registrieren</span>
      </p>
    </div>
  );
}

export default function Auth({ onAuthSuccess }) {
  const [view, setView] = useState('login'); // 'login' or 'register'

  return view === 'login' ? (
    <Login onLogin={onAuthSuccess} setView={setView} />
  ) : (
    <Registration onRegister={onAuthSuccess} setView={setView} />
  );
}