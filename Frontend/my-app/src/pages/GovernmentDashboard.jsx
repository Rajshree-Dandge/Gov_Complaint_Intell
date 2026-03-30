import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './GovernmentDashboard.css';

export default function GovernmentDashboard() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Identity: Pulling from Storage
  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [complaintsRes, heatmapRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/get-complaints?ward=${officerWard}&category=${category}`, config),
        axios.get(`http://127.0.0.1:8000/get-heatmap?ward=${officerWard}&category=${category}`, config)
      ]);

      setComplaints(complaintsRes.data || []);
      setClusters(heatmapRes.data?.clusters || []);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
      }
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [category]);

  const getPrioBadge = (score) => {
    if (score >= 7.5) return <span className="badge-sovereign urgent">🔴 CRITICAL RISKS</span>;
    if (score >= 4.0) return <span className="badge-sovereign elevated">🟡 ELEVATED</span>;
    return <span className="badge-sovereign stable">🟢 STABLE</span>;
  };

  if (loading) return <div className="loader">Fusing AI Intelligence...</div>;

  return (
    <div className="dashboard-wrapper digital-sunlight">
      <header className="dash-header sovereign-border">
        <button className="btn-return" onClick={() => navigate('/gov-landing')}>← RETURN TO COMMAND</button>
        <h2>{category} Sovereign Intelligence Report</h2>
        <span className="location-tag">📍 JURISDICTION: {officerWard}</span>
      </header>

      {/* REVOLUTIONARY REFLECTOR */}
      <div className="map-container-styled">
        <MapContainer center={[19.0760, 72.8777]} zoom={12} style={{height: '100%'}}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {clusters.map((c, i) => (
            <CircleMarker 
              key={i} 
              center={[c.lat, c.lon]} 
              radius={10 + (c.count * 5)}
              pathOptions={{
                color: c.severity >= 7.5 ? '#dc2626' : c.color, 
                fillColor: c.severity >= 7.5 ? '#dc2626' : c.color, 
                fillOpacity: 0.6,
                className: c.severity >= 7.5 ? 'visual-bloom-pulse' : ''
              }}
            >
              <Popup>Sovereign Risk: {c.severity}/10 | Grievances: {c.count}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="table-section">
        <table className="triage-table">
          <thead>
            <tr><th>INTEL CATEGORY</th><th>CITIZEN IDENTITY</th><th>RISK SCORE</th><th>COORDINATES</th><th>SITUATION EVIDENCE</th></tr>
          </thead>
          <tbody>
            {complaints.map(item => (
              <tr key={item.id}>
                <td>{getPrioBadge(item.ai_score)}</td>
                <td>{item.full_name}</td>
                <td>{item.ai_score.toFixed(1)}</td>
                <td>{item.location}</td>
                <td><button onClick={() => window.open(`http://127.0.0.1:8000/${item.image_path}`)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}