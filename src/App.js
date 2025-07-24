import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './Auth';
import Calendar from './Calendar';
import ShoppingList from './ShoppingList';
import Chores from './Chores';
import AdminPanel from './AdminPanel';
import News from './News';
import FoodOrder from './FoodOrder';
import Settings from './Settings';
import Weather from './Weather';
import PhotoGallery from './PhotoGallery';
import Chat from './Chat';

const TABS_BASE = [
  { label: 'News', key: 'news', icon: '📰' },
  { label: 'Chat', key: 'chat', icon: '💬' },
  { label: 'Galerie', key: 'gallery', icon: '🖼️' },
  { label: 'Wetter', key: 'weather', icon: '🌦️' },
  { label: 'Kalender', key: 'calendar', icon: '📅' },
  { label: 'Einkaufszettel', key: 'shopping', icon: '🛒' },
  { label: 'Hausarbeiten', key: 'chores', icon: '🧹' },
  { label: 'Essens-Bestellung', key: 'food', icon: '🍔' },
];

const ADMIN_TABS = [
  { label: 'Admin', key: 'admin', icon: '⚙️' },
  { label: 'Einstellungen', key: 'settings', icon: '⚙️' },
];

const USER_TABS = [
    { label: 'Einstellungen', key: 'settings', icon: '⚙️' },
];

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(TABS_BASE[0].key);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedUser = localStorage.getItem('familien_app_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedTheme = localStorage.getItem('familien_app_theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    localStorage.setItem('familien_app_user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('familien_app_user');
    setUser(null);
    setSidebarOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('familien_app_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const availableTabs = user && user.is_admin ? [...TABS_BASE, ...ADMIN_TABS] : [...TABS_BASE, ...USER_TABS];

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setSidebarOpen(false);
  };

  return (
    <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Familien App</h3>
        </div>
        <nav className="sidebar-nav">
          {availableTabs.map(tab => (
            <a
              key={tab.key}
              href="#"
              className={`nav-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleTabClick(tab.key); }}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span>Angemeldet als:</span>
            <strong>{user.name}</strong>
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="main-content">
        <header className="main-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            ☰
          </button>
          <h1>{availableTabs.find(t => t.key === activeTab)?.label}</h1>
        </header>
        <main className="content-area">
          {activeTab === 'news' && <News user={user} />}
          {activeTab === 'calendar' && <Calendar user={user} />}
          {activeTab === 'shopping' && <ShoppingList user={user} />}
          {activeTab === 'chores' && <Chores user={user} />}
          {activeTab === 'food' && <FoodOrder user={user} />}
          {activeTab === 'admin' && user.is_admin && <AdminPanel />}
          {activeTab === 'settings' && <Settings user={user} theme={theme} onToggleTheme={toggleTheme} />}
          {activeTab === 'weather' && <Weather />}
          {activeTab === 'gallery' && <PhotoGallery user={user} />}
          {activeTab === 'chat' && <Chat user={user} />}
        </main>
      </div>
    </div>
  );
}

export default App;
