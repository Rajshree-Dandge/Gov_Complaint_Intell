import React, { useState } from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './GovernmentDashboard.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

export default function GovernmentDashboard() {
  const { complaints, updateStatus } = useComplaints();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterWard, setFilterWard] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const categories = ['All', ...new Set(complaints.map((c) => c.category))];
  const statuses = ['All', ...STATUS_OPTIONS];
  const wards = ['All', ...new Set(complaints.map((c) => c.ward).filter(Boolean))];

  const filtered = complaints.filter((c) => {
    if (filterCategory !== 'All' && c.category !== filterCategory) return false;
    if (filterStatus !== 'All' && c.status !== filterStatus) return false;
    if (filterWard !== 'All' && c.ward !== filterWard) return false;
    if (searchTerm && !c.description.toLowerCase().includes(searchTerm.toLowerCase()) && !c.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <span className="nav-icon">🏛️</span>
          <span>Grievance Management System</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">Dashboard</Link>
          <Link to="/reports" className="nav-link">Reports</Link>
          <Link to="/" className="nav-link">Citizen Portal</Link>
          <button className="nav-logout" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="stats-bar">
          <div className="stat-card stat-total">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card stat-pending">
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-progress">
            <div className="stat-number">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card stat-resolved">
            <div className="stat-number">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="filters-bar">
          <input
            className="search-input"
            placeholder="Search by ID or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
            {wards.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>

        <div className="complaints-table-wrap">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Citizen</th>
                <th>Category</th>
                <th>Location</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => setSelectedComplaint(c)}>
                  <td className="id-cell">{c.id}</td>
                  <td>{c.date}</td>
                  <td>{c.citizenName}</td>
                  <td><span className={`cat-badge cat-${c.category.toLowerCase().replace(/\s/g, '')}`}>{c.category}</span></td>
                  <td>{c.location}</td>
                  <td><span className={`priority-badge priority-${c.priority.toLowerCase()}`}>{c.priority}</span></td>
                  <td>
                    <select
                      className={`status-select status-${c.status.toLowerCase().replace(/\s/g, '')}`}
                      value={c.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn-view" onClick={(e) => { e.stopPropagation(); setSelectedComplaint(c); }}>View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-row">No complaints found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedComplaint(null)}>×</button>
            <h2>{selectedComplaint.id}</h2>
            <div className="modal-grid">
              <div><strong>Citizen:</strong> {selectedComplaint.citizenName}</div>
              <div><strong>Date:</strong> {selectedComplaint.date}</div>
              <div><strong>Category:</strong> {selectedComplaint.category}</div>
              <div><strong>Priority:</strong> {selectedComplaint.priority}</div>
              <div><strong>Location:</strong> {selectedComplaint.location}</div>
              <div><strong>Ward:</strong> {selectedComplaint.ward || '—'}</div>
              <div><strong>Sentiment:</strong> {selectedComplaint.sentiment}</div>
              <div><strong>Status:</strong> {selectedComplaint.status}</div>
            </div>
            <div className="modal-desc">
              <strong>Description:</strong>
              <p>{selectedComplaint.description}</p>
            </div>
            {selectedComplaint.history && selectedComplaint.history.length > 0 && (
              <div className="modal-timeline">
                <strong>Status Timeline</strong>
                <div className="timeline">
                  {selectedComplaint.history.map((entry, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className="timeline-dot-wrap">
                        <div className={'timeline-dot dot-' + entry.status.toLowerCase().replace(/\s/g, '')}></div>
                        {idx < selectedComplaint.history.length - 1 && <div className="timeline-line"></div>}
                      </div>
                      <div className="timeline-content">
                        <span className={'timeline-status status-' + entry.status.toLowerCase().replace(/\s/g, '')}>{entry.status}</span>
                        <span className="timeline-note">{entry.note}</span>
                        <span className="timeline-time">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedComplaint.imageUrl && (
              <div className="modal-image">
                <img src={selectedComplaint.imageUrl} alt="Complaint evidence" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
