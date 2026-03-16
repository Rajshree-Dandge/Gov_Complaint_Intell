import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GovernmentLanding.css';

export default function GovLanding() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  // 1. Retrieve the identity of the officer from localStorage (The "Mock" Login)
  const officerName = localStorage.getItem("gov_user") || "Officer";
  const [officerWard, setOfficerWard] = useState(localStorage.getItem("gov_ward") || "Loading...");

  // 2. Fetch the counts for the 4 categories from the Backend
  useEffect(() => {
    const fetchWardStats = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/get-ward-stats?ward=${officerWard}`);
        // Backend returns: { "stats": { "Roads": 5, "Garbage": 2... } }
        setStats(res.data.stats || {});
      } catch (err) {
        console.error("Error fetching ward stats:", err);
      } finally {
        setLoading(false);
      }
    };
    if (officerWard !== "Loading...") {
      fetchWardStats();
    }
  }, [officerWard]);

  // 3. Definition of the 4 Cards (Matching your sketch)
  const categories = [
    { key: "Roads & Infrastructure", title: "Roads & Infra", icon: "🛣️", color: "#1e293b" },
    { key: "Water Supply", title: "Water Leakage", icon: "💧", color: "#0284c7" },
    { key: "Electricity/Power", title: "Electricity", icon: "⚡", color: "#d97706" },
    { key: "Sanitation & Waste", title: "Garbage", icon: "🗑️", color: "#059669" }
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // 4. Handle Card Click (Drill-down logic)
  const handleCategoryClick = (categoryKey) => {
    // Encodes the string for URL safety (e.g., "Roads & Infrastructure" -> "Roads%20&%20Infrastructure")
    const encodedCategory = encodeURIComponent(categoryKey);
    navigate(`/dashboard/${encodedCategory}`);
  };

  if (loading) return <div className="loader">Initializing Command Center...</div>;

  return (
    <div className="landing-page">
      <nav className="gov-nav">
        <div className="nav-left">
          <span className="emblem">🏛️</span>
          <h2>Digital Governance Hub</h2>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </nav>

      <header className="landing-header">
        <h1>Welcome, {officerName}</h1>
        <div className="ward-badge">📍 Operating Zone: <strong>{officerWard}</strong></div>
        <p>Select a department to view verified grievances and the AI Severity Heatmap.</p>
      </header>

      <main className="card-grid">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="dept-card"
            onClick={() => handleCategoryClick(cat.key)}
          >
            <div className="card-top">
              <span className="card-icon">{cat.icon}</span>
              <span className="live-tag">LIVE</span>
            </div>

            <div className="card-body">
              <h3>{cat.title}</h3>
              {/* If no complaints found, show 0. If AI score is high, it would be red here */}
              <h1 className="complaint-count">{stats[cat.key] || 0}</h1>
              <p>Active Grievances</p>
            </div>

            <div className="card-footer" style={{ backgroundColor: cat.color }}>
              <span>Access Desk 1 →</span>
            </div>
          </div>
        ))}
      </main>

      <footer className="landing-footer">
        <p>© 2024 Ministry of Smart City Infrastructure - AI Automated Triage System</p>
      </footer>
    </div>
  );
}