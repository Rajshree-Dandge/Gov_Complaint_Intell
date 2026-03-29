import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './GovernmentDashboard.css';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, 
  Map as MapIcon, 
  ChevronLeft, 
  Clock,
  Camera,
  CheckCircle2,
  AlertOctagon,
  Calendar,
  User,
  Zap
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
    <div className={`timer-widget ${timeLeft === 'OVERDUE' ? 'overdue' : ''}`} style={{fontFamily: 'JetBrains Mono', fontSize: '0.8rem', fontWeight: 800}}>
      {timeLeft !== 'OVERDUE' && '⌛'} {timeLeft}
    </div>
  );
};

export default function GovDashboard() {
  const { category } = useParams();
  const { user, isAuthenticated } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([17.1475, 73.2685]);

  const officerWard = user?.ward || localStorage.getItem("gov_ward") || "Ganpatipule GP";
  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

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
    } catch (err) {
      console.error("Newspaper Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, officerWard]);

  const handleIssueJobCard = async (id) => {
    try {
        const token = localStorage.getItem('token');
        await axios.post(`http://127.0.0.1:8000/api/v1/complaints/${id}/issue-job-card`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchData(); // Refresh
    } catch (err) {
        console.error("Dispatch Error:", err);
    }
  };

  const handleResolve = async (id, file) => {
    if (!file) return;
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('after_photo', file);
        
        await axios.patch(`http://127.0.0.1:8000/resolve-grievance/${id}`, formData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        fetchData(); // Refresh
    } catch (err) {
        console.error("Resolution Error:", err);
    }
  };

  const getSeverityBadge = (score) => {
    if (score >= 7.5) return <span className="severity-badge badge-dangerous">PUBLIC RISK INDEX: {score} (CRITICAL)</span>;
    if (score >= 4.0) return <span className="severity-badge badge-moderate">PUBLIC RISK INDEX: {score} (MODERATE)</span>;
    return <span className="severity-badge badge-neutral">PUBLIC RISK INDEX: {score} (NEUTRAL)</span>;
  };

  if (loading) return <div className="war-room-loader"><span>Typesetting The News...</span></div>;

  const activeComplaints = complaints.filter(c => c.status !== 'resolved');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
  const topStory = activeComplaints.reduce((prev, current) => (prev.ai_score > current.ai_score) ? prev : current, activeComplaints[0]);
  
  const scope = systemConfig.administrative_scope || 'Municipal Corporation';
  const isPanchayat = scope === 'Gram Panchayat';
  
  // DYNAMIC ARCHITECT: ADMINISTRATIVE LABELS (THE MORNING NEWSPAPER MOULD)
  const dashboardTitle = isPanchayat ? "Village Governance Live: Ganpatipule Command" : "City Intelligence Live";
  const departmentLabel = isPanchayat ? 'Work Units' : 'Administrative Domain';
  const severityLabel = isPanchayat ? "Village Risk Index" : "Public Risk Index";
  const officerLabel = isPanchayat ? "Field Team" : "Officer Identity";

  return (
    <div className="dashboard-wrapper">
      {/* --- NEWSPAPER HEADER --- */}
      <header className="newspaper-header" style={{fontFamily: 'Inter, sans-serif'}}>
        <div className="header-top">
            <span>Vol. 2026 - Digital Edition</span>
            <span><Calendar size={14} style={{verticalAlign: 'middle'}}/> {currentDate}</span>
            <span><User size={14} style={{verticalAlign: 'middle'}}/> {officerLabel}: Verified</span>
        </div>
        <h1 className="newspaper-title" style={{letterSpacing: '-2px'}}>{dashboardTitle}</h1>
        <div className="header-bottom" style={{borderTop: '2px solid #000', padding: '0.75rem 0', display: 'flex', justifyContent: 'center', gap: '2rem', fontWeight: 800}}>
            <span>🏛️ BODY: {scope.toUpperCase()}</span>
            <span>📍 SECTOR: {officerWard.toUpperCase()}</span>
            <span>🧠 TRIAGE ROLE: {category || 'GENERAL'}</span>
        </div>
      </header>

      <div className="newspaper-body">
        {/* --- MAIN COLUMN: TOP STORY & AUDIT --- */}
        <main className="top-story">
          {topStory ? (
            <>
                <div className="headline-wrap">
                    {getSeverityBadge(topStory.ai_score)}
                    <h2 className="headline-large">{topStory.location}: {topStory.text_desc.split('.')[0]}</h2>
                </div>
                <div className="featured-image-wrap">
                    <img src={`http://127.0.0.1:8000/${topStory.image_path}`} alt="Evidence" className="featured-image" />
                    <div className="ai-truth-tag">📍 TRUTH VERIFIED BY AI</div>
                </div>
                <p className="story-content" style={{fontSize: '1.2rem', lineHeight: '1.6', columnCount: 2, columnGap: '2rem', textAlign: 'justify'}}>
                    {topStory.text_desc} In a sovereign verification scan, this issue has been flagged with a {severityLabel} of {topStory.ai_score}. 
                    Immediate intervention is recommended for this area in {topStory.ward_zone}.
                    <br /><br />
                    The {departmentLabel} has been alerted to this {topStory.ai_category} case. 
                    {topStory.status === 'assigned' ? (
                        <div className="dispatch-confirmation" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                           <span>🚩 BATTLE-READY DISPATCH. RESOLUTION TRACKER IS LIVE.</span>
                           <label className="btn-resolve" style={{cursor: 'pointer', padding: '0.5rem 1rem', background: '#10b981', color: '#fff', borderRadius: '4px', fontWeight: 900}}>
                              MARK AS RESOLVED
                              <input type="file" style={{display: 'none'}} onChange={(e) => handleResolve(topStory.id, e.target.files[0])} />
                           </label>
                        </div>
                    ) : (
                        <button className="btn-issue" onClick={() => handleIssueJobCard(topStory.id)}>Issue Sovereignty Job Card</button>
                    )}
                </p>
            </>
          ) : (
            <div style={{textAlign: 'center', padding: '5rem'}}>
                <h2 className="headline-large">All Quiet in {officerWard}</h2>
                <p>No active grievances matching the triage criteria.</p>
            </div>
          )}

          {/* VISUAL AUDIT SECTION */}
          <section className="visual-audit-section">
            <h3 className="sidebar-title" style={{fontSize: '2rem'}}>Visual Audit: Promises Kept</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem'}}>
                {resolvedComplaints.map(item => (
                    <div key={item.id} className="audit-item">
                        <h4 style={{fontFamily: 'Playfair Display', marginBottom: '0.5rem'}}>{item.location} - {item.ai_category}</h4>
                        <div className="audit-grid">
                            <div className="audit-card">
                                <img src={`http://127.0.0.1:8000/${item.image_path}`} alt="Before" className="audit-img" />
                                <div className="audit-label">Before: Neglect</div>
                            </div>
                            <div className="audit-card">
                                <img src={`http://127.0.0.1:8000/uploads/resolutions/test_fixed.jpg`} alt="After" className="audit-img" />
                                <div className="audit-label" style={{color: 'var(--accent-emerald)'}}>After: Governance</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </section>
        </main>

        {/* --- SIDEBAR: TRIAGE & MAP --- */}
        <aside className="newspaper-sidebar">
          <div className="briefing-box">
            <h3 className="sidebar-title">Active Briefing</h3>
            <ul className="triage-list">
                {activeComplaints.slice(1, 10).map(item => (
                    <li key={item.id} className="triage-item">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                            <div>
                                {getSeverityBadge(item.ai_score)}
                                <h4 style={{fontFamily: 'Playfair Display', margin: '0.25rem 0'}}>{item.location}</h4>
                                <small style={{color: '#64748b'}}>{item.ai_category}</small>
                            </div>
                            <CountdownTimer deadline={item.deadline_at} />
                        </div>
                        {item.status === 'assigned' ? (
                            <label className="btn-resolve" style={{fontSize: '0.7rem', padding: '0.4rem', marginTop: '0.5rem', background: '#10b981', color: '#fff', display: 'inline-block', borderRadius: '4px', fontWeight: 900, cursor: 'pointer'}}>
                                 MARK RESOLVED
                                <input type="file" style={{display: 'none'}} onChange={(e) => handleResolve(item.id, e.target.files[0])} />
                            </label>
                        ) : (
                            <button className="btn-issue" style={{fontSize: '0.7rem', padding: '0.4rem', marginTop: '0.5rem'}} onClick={() => handleIssueJobCard(item.id)}>Issue Card</button>
                        )}
                    </li>
                ))}
            </ul>
          </div>

          <div className="briefing-box leaderboard-widget">
             <h3 className="sidebar-title">Sovereign Performance</h3>
             <div className="leaderboard-item">
                <span className="worker-rank">#1</span>
                <div className="worker-info">
                    <strong>Rahul Patil (Field Team Lead)</strong>
                    <p>4 Verified Fixes this week</p>
                </div>
                <div className="score-badge">EXCEPTIONAL</div>
             </div>
          </div>

          <div className="briefing-box">
             <h3 className="sidebar-title">Hotspot Triage</h3>
             <div className="newspaper-map-container">
                <MapContainer center={mapCenter} zoom={13} style={{height: '100%', background: '#F0F9FF'}}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapController center={mapCenter} />
                    {clusters.map((cluster, idx) => (
                        <CircleMarker
                        key={idx}
                        center={[cluster.lat, cluster.lon]}
                        radius={cluster.severity >= 7.5 ? 25 : 15}
                        pathOptions={{
                            fillColor: cluster.color,
                            color: cluster.color,
                            fillOpacity: 0.6,
                            weight: 2,
                            className: cluster.severity >= 7.5 ? 'visual-bloom-pulse' : ''
                        }}
                        >
                        <Popup>
                            <strong>Administrative Hotspot</strong><br />
                            {severityLabel}: {cluster.severity.toFixed(1)}/10
                        </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}