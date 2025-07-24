import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import './Chores.css';

export default function Chores({ user }) {
  const [chores, setChores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ task: '', assigned_to: '', due_date: '' });
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Lade Hausarbeiten
    const { data: choresData, error: choresError } = await supabase
      .from('chores')
      .select('*')
      .order('created_at', { ascending: true });

    if (choresError) {
      setError('Fehler beim Laden der Hausarbeiten.');
      setChores([]);
    } else {
      setChores(choresData);
    }

    // Lade Benutzer für das Zuweisungs-Dropdown (ohne Admins)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('name')
      .eq('is_admin', false);
    
    if (!usersError) {
      setUsers(usersData);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('chores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' }, payload => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddChore = async (e) => {
    e.preventDefault();
    if (!form.task) return;

    const { error } = await supabase.from('chores').insert([
      {
        task: form.task,
        assigned_to: form.assigned_to || null,
        created_by: user.name,
        due_date: form.due_date || null,
      }
    ]);

    if (error) {
      setError('Fehler beim Hinzufügen der Aufgabe.');
    } else {
      setForm({ task: '', assigned_to: '', due_date: '' });
      setError(null);
    }
  };

  const toggleChoreDone = async (id, currentState) => {
    await supabase
      .from('chores')
      .update({ is_done: !currentState })
      .eq('id', id);
  };

  const deleteChore = async (id) => {
    await supabase
      .from('chores')
      .delete()
      .eq('id', id);
  };

  return (
    <div className="chores-container">
      <h2>Hausarbeiten-Liste</h2>
      <form onSubmit={handleAddChore} className="add-chore-form">
        <input
          type="text"
          name="task"
          placeholder="Neue Aufgabe"
          value={form.task}
          onChange={handleInputChange}
          required
        />
        <select
          name="assigned_to"
          value={form.assigned_to}
          onChange={handleInputChange}
        >
          <option value="">Zuweisen an...</option>
          {users.map(u => (
            <option key={u.name} value={u.name}>{u.name}</option>
          ))}
        </select>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={handleInputChange}
        />
        <button type="submit">Hinzufügen</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Lade Aufgaben...</p>
      ) : (
        <ul className="chore-list">
          <h3>Offene Aufgaben</h3>
          {chores.filter(c => !c.is_done).length === 0 && <li className="empty-list">Super, alles erledigt!</li>}
          {chores.filter(c => !c.is_done).map(c => (
            <li key={c.id} className="chore-item">
              <div className="chore-details" onClick={() => toggleChoreDone(c.id, c.is_done)}>
                <input type="checkbox" checked={c.is_done} readOnly />
                <span className="chore-task">{c.task}</span>
                {c.assigned_to && <span className="assigned-to">({c.assigned_to})</span>}
                {c.due_date && <span className="due-date">bis {new Date(c.due_date).toLocaleDateString('de-DE')}</span>}
              </div>
              <button onClick={() => deleteChore(c.id)} className="delete-button">×</button>
            </li>
          ))}

          <h3 className="done-header">Erledigte Aufgaben</h3>
          {chores.filter(c => c.is_done).map(c => (
            <li key={c.id} className="chore-item done">
              <div className="chore-details" onClick={() => toggleChoreDone(c.id, c.is_done)}>
                <input type="checkbox" checked={c.is_done} readOnly />
                <span className="chore-task">{c.task}</span>
                {c.assigned_to && <span className="assigned-to">({c.assigned_to})</span>}
                 {c.due_date && <span className="due-date">bis {new Date(c.due_date).toLocaleDateString('de-DE')}</span>}
              </div>
              <button onClick={() => deleteChore(c.id)} className="delete-button">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
