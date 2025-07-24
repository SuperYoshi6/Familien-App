import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Weather.css';

const API_KEY = '24361fb4ffda79fd4239dc33a5697d7c';

const Weather = () => {
  const [location, setLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState(JSON.parse(localStorage.getItem('weather_cards')) || [
    { id: 'main', order: 0, content: null },
    { id: 'hourly', order: 1, content: null },
    { id: 'details', order: 2, content: null },
    { id: 'daily', order: 3, content: null },
  ]);

  const fetchWeatherData = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de`);
      if (!weatherResponse.ok) throw new Error('Wetterdaten konnten nicht geladen werden.');
      const current = await weatherResponse.json();
      setWeatherData(current);

      const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=de`);
      if (!forecastResponse.ok) throw new Error('Vorhersagedaten konnten nicht geladen werden.');
      const forecast = await forecastResponse.json();
      setForecastData(forecast);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({ 
            lat: position.coords.latitude, 
            lon: position.coords.longitude 
          });
        },
        (error) => {
          setError('Standort konnte nicht abgerufen werden. Bitte erlaube den Zugriff.');
          // Fallback to a default city if location is denied
          fetchWeatherData(49.74, 8.11); // Alzey coordinates
        }
      );
    } else {
      setError('Geolokalisierung wird von diesem Browser nicht unterstützt.');
      fetchWeatherData(49.74, 8.11); // Alzey coordinates
    }
  }, [fetchWeatherData]);

  useEffect(() => {
    if (location) {
      fetchWeatherData(location.lat, location.lon);
    }
  }, [location, fetchWeatherData]);

  const getIconUrl = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`;

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(cards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedCards = items.map((item, index) => ({ ...item, order: index }));
    setCards(updatedCards);
    localStorage.setItem('weather_cards', JSON.stringify(updatedCards));
  };

  const renderCardContent = (cardId) => {
    switch (cardId) {
      case 'main':
        return weatherData && (
          <>
            <h2>{weatherData.name}</h2>
            <p className="temperature">{Math.round(weatherData.main.temp)}°C</p>
            <div className="main-weather-details">
              <img src={getIconUrl(weatherData.weather[0].icon)} alt={weatherData.weather[0].description} />
              <p>{weatherData.weather[0].description}</p>
            </div>
            <p>Gefühlt wie: {Math.round(weatherData.main.feels_like)}°C</p>
            <p>Max: {Math.round(weatherData.main.temp_max)}°C / Min: {Math.round(weatherData.main.temp_min)}°C</p>
          </>
        );
      case 'hourly':
        return forecastData && (
          <>
            <h3>Stündliche Vorhersage</h3>
            <div className="hourly-items">
              {forecastData.list.slice(0, 8).map((item, index) => (
                <div key={index} className="hourly-item">
                  <span>{new Date(item.dt * 1000).getHours()}:00</span>
                  <img src={getIconUrl(item.weather[0].icon)} alt={item.weather[0].description} />
                  <span>{Math.round(item.main.temp)}°C</span>
                </div>
              ))}
            </div>
          </>
        );
      case 'details':
        return weatherData && (
          <>
            <h3>Details</h3>
            <p>Luftfeuchtigkeit: {weatherData.main.humidity}%</p>
            <p>Wind: {weatherData.wind.speed} m/s</p>
            <p>Luftdruck: {weatherData.main.pressure} hPa</p>
          </>
        );
      case 'daily':
        return forecastData && (
          <>
            <h3>5-Tage-Vorschau</h3>
            <div className="daily-items">
              {Object.entries(forecastData.list.reduce((acc, item) => {
                const date = new Date(item.dt * 1000).toLocaleDateString('de-DE', { weekday: 'short' });
                if (!acc[date]) acc[date] = { temps: [], icons: [] };
                acc[date].temps.push(item.main.temp);
                acc[date].icons.push(item.weather[0].icon);
                return acc;
              }, {})).map(([day, data], index) => {
                const minTemp = Math.round(Math.min(...data.temps));
                const maxTemp = Math.round(Math.max(...data.temps));
                const icon = data.icons[Math.floor(data.icons.length / 2)] || data.icons[0];
                return (
                  <div key={index} className="daily-item">
                    <span>{day}</span>
                    <img src={getIconUrl(icon)} alt="weather icon" />
                    <div className="temp-range"><span>{maxTemp}°</span><span>{minTemp}°</span></div>
                  </div>
                );
              })}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="weather-container">
      {loading && <p>Wetter wird geladen...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && weatherData && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="weather-cards">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="weather-grid">
                {cards.sort((a, b) => a.order - b.order).map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`weather-card ${card.id === 'main' ? 'main-weather' : ''}`}
                      >
                        {renderCardContent(card.id)}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};

export default Weather;
