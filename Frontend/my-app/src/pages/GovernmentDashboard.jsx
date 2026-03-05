import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GovernmentDashboard.css';

export default function GovDashboard() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Retrieve the ward from localStorage to keep data area-locked
  const officerWard = localStorage.getItem("gov_ward") || "Ward 5";

  // 2. Fetch filtered data from Port 8000
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      // We pass the category from the URL and the ward from storage as query parameters
      const res = await axios.get(`http://localhost:8000/get-complaints?category=${category}&ward=${officerWard}`);
      setComplaints(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      fetchComplaints();
    }
  }, [category, officerWard]);

  if (loading) return <div className="loader">Loading {category} Dashboard...</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-top">
          <button className="btn-back" onClick={() => navigate('/gov-landing')}>
            ← Back to Command Center
          </button>
          <h1>🏛️ {category} Intelligence</h1>
        </div>
        <p>Verified Grievances in <strong>{officerWard}</strong> Sorted by AI Risk Index</p>
      </header>

      <table className="complaint-table">
        <thead>
          <tr>
            <th>Priority</th>
            <th>Citizen Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>Severity Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.length > 0 ? (
            complaints.map((item) => (
              <tr key={item.id} className={item.priority === 'High' ? 'row-critical' : ''}>
                <td>
                  <span className={`badge ${item.priority.toLowerCase()}`}>
                    {item.priority}
                  </span>
                </td>
                <td>{item.full_name}</td>
                <td>{item.ai_category}</td>
                <td>{item.location}</td>
                <td className="score-cell">{item.ai_score ? item.ai_score.toFixed(1) : "0.0"} / 10</td>
                <td>
                  <button className="btn-view">View Evidence</button>
                  <button className="btn-resolve">Mark Resolved</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                No active complaints found for this category in your ward.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}