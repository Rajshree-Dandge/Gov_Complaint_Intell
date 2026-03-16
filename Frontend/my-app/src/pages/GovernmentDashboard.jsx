import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './GovernmentDashboard.css';

// --- 0. DYNAMIC CENTER CONTROLLER ---
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function GovDashboard() {
  const { category } = useParams(); // e.g., "Roads & Infrastructure"
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [stats, setStats] = useState({ total: 0, remaining: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);

  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  // --- 1. INTELLIGENT TRIAGE LOGIC (The 3 Levels) ---
  const getPriorityInfo = (score) => {
    if (score >= 7.5) return { label: '🚨 DANGEROUS', class: 'prio-dangerous' };
    if (score >= 4.0) return { label: '⚠️ MODERATE', class: 'prio-moderate' };
    return { label: '⚪ NEUTRAL', class: 'prio-neutral' };
  };

  const fetchData = async () => {
    try {
      // Parallel fetch for Table data and Heatmap clusters
      const [complaintsRes, heatmapRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/get-complaints?ward=${officerWard}&category=${category}`),
        axios.get(`http://127.0.0.1:8000/get-heatmap?ward=${officerWard}&category=${category}`)
      ]);

      const data = complaintsRes.data || [];
      const clustersData = heatmapRes.data || [];

      setComplaints(data);
      setClusters(clustersData);

      // --- DYNAMIC CENTERING LOGIC ---
      if (clustersData.length > 0) {
        setMapCenter([clustersData[0].lat, clustersData[0].lon]);
      } else if (data.length > 0) {
        setMapCenter([data[0].latitude, data[0].longitude]);
      }

      // Update Sidebar Stats (Sketch Page 2)
      const resolved = data.filter(c => c.status === 'resolved').length;
      setStats({
        total: data.length,
        remaining: data.length - resolved,
        resolved: resolved
      });
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, officerWard]);

  if (loading) return <div className="loader">Fusing AI Intelligence...</div>;

  return (
    <div className="dashboard-wrapper">
      {/* --- SIDEBAR: STATISTICS (Your Sketch Page 2) --- */}
      <aside className="gov-sidebar">
        <div className="sidebar-brand">
          <span className="emblem">🏛️</span>
          <h3>Stats Hub</h3>
        </div>

        <div className="stat-group">
          <div className="stat-box">
            <small>TODAY'S LOAD</small>
            <h2>{stats.total}</h2>
          </div>
          <div className="stat-box warning">
            <small>REMAINING</small>
            <h2>{stats.remaining}</h2>
          </div>
          <div className="stat-box success">
            <small>RESOLVED</small>
            <h2>{stats.resolved}</h2>
          </div>
        </div>

        <div className="sidebar-info">
          <h4>DBSCAN Active</h4>
          <p>Clustering complaints within 100m radius.</p>
        </div>
      </aside>

      {/* --- MAIN SECTION --- */}
      <main className="gov-main">
        <header className="gov-header">
          <button className="btn-back" onClick={() => navigate('/gov-landing')}>← Back</button>
          <h2>{category} Intelligence Panel</h2>
          <div className="ward-indicator">📍 {officerWard}</div>
        </header>

        {/* --- REVOLUTIONARY REFLECTOR: BIVARIATE HEATMAP --- */}
        <section className="map-section">
          <div className="map-header">
            <h3>📍 Severity Hotspots (DBSCAN)</h3>
            <p>Size = Volume | Color = Risk</p>
          </div>
          <MapContainer center={mapCenter} zoom={13} className="leaflet-container">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapController center={mapCenter} />

            {clusters.map((cluster, idx) => (
              <CircleMarker
                key={idx}
                center={[cluster.lat, cluster.lon]}
                // SIZE = IMPACT (Radius grows with count)
                radius={15 + (cluster.count * 3)}
                // COLOR = RISK (Red for Danger, Yellow for Neutral)
                pathOptions={{
                  fillColor: cluster.color,
                  color: cluster.color,
                  fillOpacity: 0.6,
                  weight: 2
                }}
              >
                <Popup>
                  <strong>Zone Intelligence</strong><br />
                  Peak Severity: {cluster.severity.toFixed(1)}/10<br />
                  Cluster Size: {cluster.count} Citizens
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </section>

        {/* --- TRIAGE TABLE --- */}
        <section className="table-section">
          <table className="triage-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Citizen</th>
                <th>AI Score</th>
                <th>Location</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => {
                const prio = getPriorityInfo(item.ai_score);
                return (
                  <tr key={item.id} className={item.ai_score >= 7.5 ? 'row-danger' : ''}>
                    <td><span className={`badge ${prio.class}`}>{prio.label}</span></td>
                    <td><strong>{item.full_name}</strong></td>
                    <td className="score-val">{item.ai_score.toFixed(1)}</td>
                    <td>{item.location}</td>
                    <td>
                      <button className="btn-act" onClick={() => window.open(`http://127.0.0.1:8000/${item.image_path}`)}>View</button>
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