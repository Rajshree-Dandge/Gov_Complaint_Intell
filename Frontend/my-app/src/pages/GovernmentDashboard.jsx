import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GovernmentDashboard.css';

export default function GovDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data from Port 8000
  const fetchComplaints = async () => {
    try {
      const res = await axios.get("http://localhost:8000/get-complaints");
      setComplaints(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  if (loading) return <div className="loader">Loading Official Dashboard...</div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>🏛️ Gov-AI Intelligence Command</h1>
        <p>Verified Grievances Sorted by AI Risk Index</p>
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
          {complaints.map((item) => (
            <tr key={item.id} className={item.priority === 'High' ? 'row-critical' : ''}>
              <td>
                <span className={`badge ${item.priority.toLowerCase()}`}>
                  {item.priority}
                </span>
              </td>
              <td>{item.full_name}</td>
              <td>{item.ai_category}</td>
              <td>{item.location}</td>
              <td className="score-cell">{item.ai_score.toFixed(1)} / 10</td>
              <td>
                <button className="btn-view">View Evidence</button>
                <button className="btn-resolve">Mark Resolved</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}