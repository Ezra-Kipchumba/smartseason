import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../utils/api';

export default function MapView() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Store weather + insights per field
  const [weatherMap, setWeatherMap] = useState({});
  const [loadingWeatherId, setLoadingWeatherId] = useState(null);

  useEffect(() => {
    api.get('/api/fields/map')
      .then(res => {
        console.log('MAP DATA:', res.data);
        setFields(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        console.error('Map fetch error:', err.response?.data || err.message);
        setFields([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch weather + insights
  const fetchWeather = async (field) => {
    if (!field.latitude || !field.longitude) return;

    // Avoid duplicate calls
    if (weatherMap[field.id]) return;

    try {
      setLoadingWeatherId(field.id);

      const res = await api.get(`/api/fields/${field.id}/weather`);

      setWeatherMap(prev => ({
        ...prev,
        [field.id]: {
          weather: res.data.weather,
          insights: res.data.insights
        }
      
      }));
      console.log("INSIGHTS:", res.data.insights);

    } catch (err) {
      console.error('Weather error:', err);
    } finally {
      setLoadingWeatherId(null);
    }
  };

  if (loading) return <p>Loading map...</p>;
  if (!fields.length) return <p>No map data available.</p>;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Field Map</h3>
      </div>

      <div className="map-container">
        <MapContainer
          center={[-1.286389, 36.817223]}
          zoom={9}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {fields.map(field => {
            if (!field.latitude || !field.longitude) return null;

            // ✅ FIX: properly unpack stored data
            const data = weatherMap[field.id];
            const weather = data?.weather;
            const insights = data?.insights;

            return (
              <Marker
                key={field.id}
                position={[field.latitude, field.longitude]}
                eventHandlers={{
                  // ✅ Better UX: fetch when popup opens
                  popupopen: () => fetchWeather(field)
                }}
              >
                <Popup>
                  <div>
                    <strong>{field.name}</strong><br />
                    Crop: {field.crop_type}<br />
                    Stage: {field.stage}<br />
                    Area: {field.area_hectares} ha

                    <hr />

                    {/* WEATHER */}
                    {loadingWeatherId === field.id && (
                      <p>Loading weather...</p>
                    )}

                    {weather && (
                      <>
                        <div>🌡 Temp: {weather.temp} °C</div>
                        <div>💧 Humidity: {weather.humidity}%</div>
                        <div>☁ Condition: {weather.condition}</div>
                      </>
                    )}

                    {/* SMART INSIGHTS */}
                    {insights && insights.length > 0 && (
                      <>
                        <hr />
                        <strong>Smart Insights</strong>
                        <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                          {insights.map((tip, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: '.85rem',
                                color:
                                  tip.type === 'risk' ? 'red' :
                                  tip.type === 'warning' ? 'orange' :
                                  'green'
                              }}
                            >
                              <div><strong>{tip.message}</strong></div>
                              {tip.action && (
                                <div style={{ fontSize: '.8rem' }}>
                                  👉 {tip.action}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}

                    {!weather && loadingWeatherId !== field.id && (
                      <p style={{ fontSize: '.8rem', color: '#888' }}>
                        Open popup to load weather
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}