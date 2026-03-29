import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './GovernmentDashboard.css';
import { useAuth } from '../context/AuthContext';

// --- 0. DYNAMIC CENTER CONTROLLER ---
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

// --- 1. COUNTDOWN WIDGET COMPONENT ---
const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline) {
          setTimeLeft('N/A');
          return;
      }
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) {
        setTimeLeft('OVERDUE - ESCALATED');
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setTimeLeft(`${h}h ${m}m`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <div className="timer-widget">
      <span>⏳</span> {timeLeft}
    </div>
  );
};

export default function GovDashboard() {
  const { category } = useParams(); // e.g., "Roads & Infrastructure"
  const navigate = useNavigate();
  const { isBodyAdmin, adminRole } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [stats, setStats] = useState({ total: 0, remaining: 0, resolved: 0, latency: '4.2h' });
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);

  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  // --- 2. INTELLIGENT TRIAGE LOGIC (Public Risk Index Labels) ---
  const getPriorityInfo = (score) => {
    if (score >= 7.5) return { label: 'CRITICAL RISK', class: 'prio-dangerous' };
    if (score >= 4.0) return { label: 'MODERATE RISK', class: 'prio-moderate' };
    return { label: 'STABLE', class: 'prio-neutral' };
  };

    const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [complaintsRes, heatmapRes, configRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/get-complaints?ward=${officerWard}&category=${category}`, config),
        axios.get(`http://127.0.0.1:8000/get-heatmap?ward=${officerWard}&category=${category}`, config),
        axios.get(`http://127.0.0.1:8000/api/v1/system/config`)
      ]);


      setComplaints(complaintsRes.data || []);
      setClusters(heatmapRes.data?.clusters || []);
      setSystemConfig(configRes.data || {});

      if (complaintsRes.data?.length > 0) {
          setMapCenter([complaintsRes.data[0].latitude, complaintsRes.data[0].longitude]);
      }

      const resolved = (complaintsRes.data || []).filter(c => c.status === 'resolved').length;
      setStats(prev => ({
        ...prev,
        total: complaintsRes.data?.length || 0,
        remaining: (complaintsRes.data?.length || 0) - resolved,
        resolved: resolved
      }));
    } catch (err) {
      console.error("War Room Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, officerWard]);

  if (loading) return (
    <div className="war-room-loader">
        <div className="pulse-ring"></div>
        <span>Initializing Sovereign Pipeline...</span>
    </div>
  );

  return (
    <div className="dashboard-wrapper">
      {/* --- SIDEBAR: EXECUTIVE STATS (Glassmorphism) --- */}
      <aside className="gov-sidebar">
        <div className="sidebar-brand">
          <span className="emblem">🛡️</span>
          <div>
              <h3>War Room</h3>
              <small style={{color: 'var(--accent-blue)'}}>{adminRole}</small>
          </div>
        </div>

        <div className="stat-group">
          <div className="stat-box">
            <small>Active Domain Load</small>
            <h2>{stats.total}</h2>
          </div>
          <div className="stat-box warning">
            <small>Pending Grievances</small>
            <h2>{stats.remaining}</h2>
          </div>
          <div className="stat-box success">
            <small>Resolution Rate</small>
            <h2>{stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(1) : 0}%</h2>
          </div>
          <div className="stat-box">
            <small>Avg Officer Latency</small>
            <h2 style={{color: 'var(--accent-blue)'}}>{stats.latency}</h2>
          </div>
        </div>

        {isBodyAdmin && (
            <div className="admin-moulding-panel">
                <h4>Top-Down Config</h4>
                <button className="btn-act" style={{width: '100%'}} onClick={() => alert("Admin Configuration Authority Active")}>
                    Mould Pipeline
                </button>
            </div>
        )}
      </aside>

      {/* --- MAIN BENTO GRID --- */}
      <main className="gov-main">
        <header className="gov-header">
          <button className="btn-back" onClick={() => navigate('/gov-landing')}>← Stand Down</button>
          <h2>{category} Administrative Domain</h2>
          <div className="ward-indicator">📍 {systemConfig.administrative_scope || officerWard}</div>
        </header>

        {/* --- CENTER-TOP: GREYSCALE MAP WITH PULSING DANGER --- */}
        <section className="map-section">
          <div className="map-header">
            <h3>📍 High-Risk Hotspots</h3>
            <p>Sovereign Administrative Triage Map</p>
          </div>
          <MapContainer center={mapCenter} zoom={13} className="leaflet-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController center={mapCenter} />

            {clusters.map((cluster, idx) => (
              <CircleMarker
                key={idx}
                center={[cluster.lat, cluster.lon]}
                radius={cluster.severity >= 7.5 ? 25 : 15}
                pathOptions={{
                  fillColor: cluster.severity >= 7.5 ? '#EF4444' : '#3B82F6',
                  color: cluster.severity >= 7.5 ? '#EF4444' : '#3B82F6',
                  fillOpacity: 0.6,
                  weight: 2
                }}
              >
                <Popup>
                  <strong>Zone Intelligence</strong><br />
                  Public Risk Index: {cluster.severity.toFixed(1)}/10<br />
                  Verified Items: {cluster.count}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>

        {/* --- CENTER-BOTTOM: TRIAGE TABLE --- */}
        <section className="table-section">
          <table className="triage-table">
            <thead>
              <tr>
                <th>Public Risk Index</th>
                <th>Administrative Source</th>
                <th>SLA Countdown</th>
                <th>Location</th>
                <th>Intelligence</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => {
                const prio = getPriorityInfo(item.ai_score);
                return (
                  <tr key={item.id}>
                    <td><span className={`badge ${prio.class}`}>{prio.label}</span></td>
                    <td><strong>{item.full_name}</strong></td>
                    <td><CountdownTimer deadline={item.deadline_at} /></td>
                    <td>{item.location}</td>
                    <td>
                      <button className="btn-act" onClick={() => window.open(`http://127.0.0.1:8000/${item.image_path}`)}>Scan Proof</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}