import React from 'react';
import Feedback from './Feedback';
import './Settings.css';

export default function Settings({ user, theme, onToggleTheme }) {
  const version = "1.1.0"; // Manually set version number

  return (
    <div className={`settings-container ${theme}`}>
      <h2>Einstellungen</h2>

      <div className="settings-section">
        <h3>Darstellung</h3>
        <div className="theme-switcher">
          <span>{theme === 'light' ? '☀️' : '🌙'}</span>
          <label className="switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme} />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Feedback</h3>
        <Feedback user={user} />
      </div>

      <div className="settings-section version-info">
        <p>Version: {version}</p>
      </div>
    </div>
  );
}
