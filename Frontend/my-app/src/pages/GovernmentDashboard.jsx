import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './GovernmentDashboard.css';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Users, 
  Map as MapIcon, 
  Activity, 
  Zap, 
  ChevronLeft, 
  Bot, 
  AlertTriangle, 
  TrendingUp,
  Briefcase
} from 'lucide-react';

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
        setTimeLeft('OVERDUE');
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
    <div className={`timer-widget ${timeLeft === 'OVERDUE' ? 'overdue' : ''}`}>
      <span>⏳</span> {timeLeft}
    </div>
  );
};

// --- 2. AI ADVISOR COMPONENT ---
const AIAdvisor = ({ complaintsCount, fieldWorkers }) => {
    const ratio = complaintsCount / (fieldWorkers || 1);
    let message = "AI Suggestion: Resources are currently optimal.";
    
    if (ratio > 5) {
        message = `AI Suggestion: Critical Load. Reassign 3 workers from Ward Y to clear high-risk hotspots.`;
    } else if (ratio > 2) {
        message = `AI Suggestion: Alert. Reassign 2 workers to Ward X to clear red zone hotspots.`;
    } else {
        message = `AI Suggestion: Proactive Maintenance. Verify completed tasks to optimize workforce latency.`;
    }

    return (
        <div className="ai-advisor">
            <div className="ai-icon">
                <Bot size={32} />
            </div>
            <div className="ai-text">
                <h4>Sovereign Intelligence Unit</h4>
                <p>{message}</p>
            </div>
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
  const [stats, setStats] = useState({ total: 0, remaining: 0, resolved: 0, latency: '3.8h' });
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);

  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  // Parse worker mapping from systemConfig
  const workerMapping = useMemo(() => {
    if (systemConfig.category_mapping) {
        try {
            return JSON.parse(systemConfig.category_mapping);
        } catch (e) { return {}; }
    }
    return {};
  }, [systemConfig]);

  const fieldWorkersCount = parseInt(workerMapping.field_workers) || 10;

  // --- 2. INTELLIGENT TRIAGE LOGIC (Public Risk Index Labels) ---
  const getPriorityInfo = (score) => {
    if (score >= 7.5) return { label: 'CRITICAL', class: 'prio-dangerous' };
    if (score >= 4.0) return { label: 'ELEVATED', class: 'prio-moderate' };
    return { label: 'STABLE', class: 'prio-neutral' };
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const configHeaders = { headers: { Authorization: `Bearer ${token}` } };
      
      const [complaintsRes, heatmapRes, configRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/get-complaints?ward=${officerWard}&category=${category}`, configHeaders),
        axios.get(`http://127.0.0.1:8000/get-heatmap?ward=${officerWard}&category=${category}`, configHeaders),
        axios.get(`http://127.0.0.1:8000/api/v1/system/config`, configHeaders)
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
        <Bot size={48} className="pulse-ai" />
        <span>Syncing Nivaran Sovereign Pipeline...</span>
    </div>
  );

  const scope = systemConfig.administrative_scope || 'Municipal Corporation';

  return (
    <div className="dashboard-wrapper">
      {/* --- SIDEBAR: EXECUTIVE STATS --- */}
      <aside className="gov-sidebar">
        <div className="sidebar-brand">
          <div className="emblem"><Bot size={40} color="#3B82F6" /></div>
          <h3>War Room</h3>
          <small style={{color: 'var(--accent-blue)', fontWeight: 800}}>{adminRole}</small>
        </div>

        <div className="stat-group">
          <div className="stat-box">
            <small>Active Domain Load</small>
            <h2>{stats.total}</h2>
          </div>
          <div className="stat-box">
            <small>Pending Tasks</small>
            <h2 style={{color: 'var(--accent-red)'}}>{stats.remaining}</h2>
          </div>
          <div className="stat-box">
            <small>Resolution Rate</small>
            <h2 style={{color: 'var(--accent-emerald)'}}>{stats.total > 0 ? ((stats.resolved/stats.total)*100).toFixed(1) : 0}%</h2>
          </div>
          <div className="stat-box">
            <small>Avg. Latency</small>
            <h2>{stats.latency}</h2>
          </div>
        </div>

        {isBodyAdmin && (
            <div className="admin-moulding-panel">
                <button className="btn-act" style={{width: '100%', marginTop: 'auto'}} onClick={() => navigate('/onboarding')}>
                    Mould Pipeline
                </button>
            </div>
        )}
      </aside>

      {/* --- MAIN DASHBOARD: Adaptive Layout --- */}
      <main className="gov-main">
        <header className="layout-header">
           <button className="btn-back" onClick={() => navigate('/gov-landing')} style={{background: 'transparent', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600}}>
             <ChevronLeft size={18} /> Stand Down
           </button>
           <div className="ward-indicator" style={{background: '#eff6ff', color: '#3b82f6', padding: '0.5rem 1.25rem', borderRadius: '99px', fontWeight: 800, fontSize: '0.85rem'}}>
             📍 {scope} | {officerWard}
           </div>
        </header>

        <AIAdvisor complaintsCount={stats.remaining} fieldWorkers={fieldWorkersCount} />

        {/* MOULDING LOGIC: Gram Panchayat (Task-Oriented) vs Municipal (Data-Oriented) */}
        {scope === 'Gram Panchayat' ? (
            <div className="onboarding-stage">
                <div className="section-title" style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                    <Briefcase size={20} color="#10B981" /> <h3>Workforce Priority Queue</h3>
                </div>
                <div className="worker-cards-grid">
                    {complaints.length > 0 ? complaints.map((item) => {
                        const prio = getPriorityInfo(item.ai_score);
                        return (
                            <div key={item.id} className="worker-card">
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                                    <span className={`badge ${prio.class}`}>{prio.label} RISK</span>
                                    <CountdownTimer deadline={item.deadline_at} />
                                </div>
                                <h4 style={{margin: '0 0 0.5rem 0'}}>{item.location}</h4>
                                <p style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem'}}>{item.text_desc.substring(0, 100)}...</p>
                                <button className="btn-act" style={{width: '100%'}} onClick={() => window.open(`http://127.0.0.1:8000/${item.image_path}`)}>
                                    Scan Proof
                                </button>
                            </div>
                        )
                    }) : (
                        <div className="stat-box" style={{gridColumn: 'span 3', textAlign: 'center', padding: '3rem'}}>
                            <Bot size={40} color="#e2e8f0" style={{marginBottom: '1rem'}} />
                            <p>No active tasks in the sovereign queue.</p>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="onboarding-stage data-grid">
                <div className="dashboard-card" style={{gridColumn: 'span 1'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                        <MapIcon size={20} color="#3B82F6" /> <h4 style={{margin:0}}>Sovereign Triage Map</h4>
                    </div>
                    <div className="map-container-wrapper">
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
                    </div>
                </div>

                <div className="dashboard-card">
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'}}>
                        <Activity size={20} color="#F59E0B" /> <h4 style={{margin:0}}>Priority Triage</h4>
                    </div>
                    <table className="triage-table">
                        <thead>
                        <tr>
                            <th>Risk Index</th>
                            <th>Countdown</th>
                            <th>Intelligence</th>
                        </tr>
                        </thead>
                        <tbody>
                        {complaints.slice(0, 6).map((item) => {
                            const prio = getPriorityInfo(item.ai_score);
                            return (
                            <tr key={item.id}>
                                <td><span className={`badge ${prio.class}`}>{prio.label}</span></td>
                                <td><CountdownTimer deadline={item.deadline_at} /></td>
                                <td>
                                <button className="btn-act" onClick={() => window.open(`http://127.0.0.1:8000/${item.image_path}`)}>Proof</button>
                                </td>
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}