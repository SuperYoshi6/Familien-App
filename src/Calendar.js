import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNotifications } from './useNotifications';
import './Calendar.css';

// --- Hilfsfunktionen für Datum und Kalender ---
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  // Sonntag = 0, Montag = 1, etc.
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Woche auf Montag starten
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// --- Hauptkomponente: Calendar ---
export default function Calendar({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPersonal, setShowPersonal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // --- Datenabruf aus Supabase ---
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const firstDay = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10);
    const lastDay = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', firstDay)
      .lte('date', lastDay)
      .order('start_time', { ascending: true });

    if (!error) {
      setEvents(data);
    }
    setLoading(false);
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- Event-Handling ---
  const handleDayClick = (day) => {
    const date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleMonthChange = (offset) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // --- Rendern der Kalender-Tage ---
  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayIndex = getFirstDayOfWeek(currentYear, currentMonth);
    const days = [];

    // Leere Felder für Tage vor dem 1. des Monats
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Tage des Monats
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = events.filter(ev => 
        ev.date === dateStr && 
        (!showPersonal || ev.persons.includes(user.name))
      );

      days.push(
        <div key={d} className="calendar-day" onClick={() => handleDayClick(d)}>
          <div className="calendar-date">{d}</div>
          <ul className="calendar-events">
            {dayEvents.map(ev => (
              <li key={ev.id} className={ev.persons.includes(user.name) ? 'personal' : ''}>
                {ev.start_time && `${ev.start_time.slice(0, 5)} `}{ev.title}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="calendar-outer">
      <div className="calendar-header">
        <button onClick={() => handleMonthChange(-1)}>&lt;</button>
        <h2>{currentDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={() => handleMonthChange(1)}>&gt;</button>
      </div>

      <div className="calendar-toggle">
        <button className={!showPersonal ? 'active' : ''} onClick={() => setShowPersonal(false)}>Gemeinsamer Kalender</button>
        <button className={showPersonal ? 'active' : ''} onClick={() => setShowPersonal(true)}>Mein Kalender</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map(wd => <div key={wd} className="calendar-weekday">{wd}</div>)}
        {loading ? <div className="calendar-loading">Lade Termine...</div> : renderDays()}
      </div>

      {isModalOpen && (
        <EventModal 
          date={selectedDate} 
          onClose={handleCloseModal} 
          onSave={fetchEvents} 
        />
      )}
    </div>
  );
}

// --- Komponente für das Termin-Modal ---
function EventModal({ date, onClose, onSave }) {
  const { sendNotification } = useNotifications();
  const [form, setForm] = useState({ 
    title: '', 
    persons: '', 
    start_time: '', 
    end_time: '' 
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.persons) {
      setError('Titel und Personen sind Pflichtfelder.');
      return;
    }
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase.from('events').insert([
      {
        date,
        title: form.title,
        persons: form.persons.split(',').map(p => p.trim()),
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      }
    ]);

    setSaving(false);
    if (insertError) {
      setError('Fehler beim Speichern des Termins.');
    } else {
      sendNotification('Neuer Termin', { body: `Ein neuer Termin wurde für ${form.persons} am ${new Date(date + 'T00:00:00').toLocaleDateString('de-DE')} eingetragen.` });
      onSave(); // Kalender neu laden
      onClose(); // Modal schließen
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Termin hinzufügen für {new Date(date + 'T00:00:00').toLocaleDateString('de-DE')}</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" placeholder="Titel" value={form.title} onChange={handleInputChange} required />
          <input type="text" name="persons" placeholder="Personen (kommagetrennt)" value={form.persons} onChange={handleInputChange} required />
          <div className="time-inputs">
            <input type="time" name="start_time" value={form.start_time} onChange={handleInputChange} />
            <span>-</span>
            <input type="time" name="end_time" value={form.end_time} onChange={handleInputChange} />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Abbrechen</button>
            <button type="submit" disabled={saving}>{saving ? 'Speichern...' : 'Speichern'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
