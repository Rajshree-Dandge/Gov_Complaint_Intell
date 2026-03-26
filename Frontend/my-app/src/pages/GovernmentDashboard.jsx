import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GrievanceMap from './Heatmap';
import './GovernmentDashboard.css';

export default function GovDashboard() {
  const { category } = useParams(); // Gets category from URL (e.g., Roads)
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ today: 0, remaining: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState([]);

  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  // --- 1. VISUAL TRIAGE LOGIC (The "Crack") ---
  const getPriorityInfo = (score) => {
    if (score >= 8.0) return { label: '🚨 CRITICAL', class: 'prio-critical' };
    if (score >= 5.0) return { label: '⚠️ HIGH', class: 'prio-high' };
    if (score >= 3.0) return { label: '🟡 MEDIUM', class: 'prio-medium' };
    return { label: '⚪ LOW', class: 'prio-low' };
  };

  const fetchData = async () => {
    try {
      // Fetch complaints filtered by Ward and Category
      const res = await axios.get(`http://localhost:8000/get-complaints?ward=${officerWard}&category=${category}`);
      setComplaints(res.data);
      
      // Calculate Stats for Sidebar (Your Handwritten Sketch Page 2)
      const todayCount = res.data.length;
      const resolvedCount = res.data.filter(c => c.status === 'resolved').length;
      setStats({
        today: todayCount,
        remaining: todayCount - resolvedCount,
        resolved: resolvedCount
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [category, officerWard]);

  const handleResolve = async (id) => {
    alert(`Marking Complaint #${id} as resolved in DB...`);
    // Future: axios.patch(`http://localhost:8000/resolve/${id}`)
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch both Table and Heatmap in parallel
      const [tableRes, mapRes] = await Promise.all([
        axios.get(`http://localhost:8000/get-complaints?ward=${officerWard}&category=${category}`),
        axios.get(`http://localhost:8000/get-heatmap?ward=${officerWard}&category=${category}`)
      ]);

      setComplaints(tableRes.data);
      setClusters(mapRes.data); // Data for the Bubbles
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <div className="loader">Analyzing Department Data...</div>;

  return (
    <div className="dashboard-layout">
      {/* --- SIDEBAR (As per your sketch) --- */}
      <aside className="stats-sidebar">
        <div className="sidebar-header">
          <h3>📊 Statistics</h3>
          <p>{category}</p>
        </div>
        <div className="stat-card">
          <span>Today's Workload</span>
          <h2>{stats.today}</h2>
        </div>
        <div className="stat-card">
          <span>Remaining Tasks</span>
          <h2 style={{ color: '#ef4444' }}>{stats.remaining}</h2>
        </div>
        <div className="stat-card">
          <span>Total Resolved</span>
          <h2 style={{ color: '#10b981' }}>{stats.resolved}</h2>
        </div>
        <div className="heatmap-placeholder">
          <h4>🗺️ AI Heatmap Reflector</h4>
          <p>DBSCAN Clustering Active</p>
          <div className="mini-map-box">[ Map Loading... ]</div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="main-dashboard">
        <header className="main-header">
          <button className="btn-back" onClick={() => navigate('/gov-landing')}>
            ← Back to Command Center
          </button>
          <h2>{category} Intelligence Dashboard</h2>
          <p>Showing verified results for <strong>{officerWard}</strong></p>
        </header>

        {/* --- THE MAP REFLECTOR --- */}
          <section style={{ marginBottom: '30px' }}>
            <h3 style={{color: '#1e293b', marginBottom: '10px'}}>📍 Severity Hotspots</h3>
            <GrievanceMap clusters={clusters} />
          </section>

        <div className="table-container">
          <table className="prio-table">
            <thead>
              <tr>
                <th>Priority Status</th>
                <th>Citizen Name</th>
                <th>AI Severity Score</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center', padding:'40px'}}>No complaints verified by AI for this category.</td></tr>
              ) : (
                complaints.map((item) => {
                  const prio = getPriorityInfo(item.ai_score);
                  return (
                    <tr key={item.id} className={item.ai_score >= 8 ? 'row-urgent' : ''}>
                      <td><span className={`prio-badge ${prio.class}`}>{prio.label}</span></td>
                      <td><strong>{item.full_name}</strong></td>
                      <td className="score-text">{item.ai_score.toFixed(1)}/10</td>
                      <td>{item.location}</td>
                      <td className="action-btns">
                        <button 
                          className="btn-action view"
                          onClick={() => window.open(`http://localhost:8000/${item.image_path}`, '_blank')}
                        >Evidence</button>
                        <button className="btn-action check" onClick={() => handleResolve(item.id)}>Resolve</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}