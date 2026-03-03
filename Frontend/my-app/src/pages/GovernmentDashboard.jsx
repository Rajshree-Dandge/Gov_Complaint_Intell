import React, { useState } from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import './GovernmentDashboard.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const SIDEBAR_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'analysis', label: 'Analysis', icon: '🔍' },
];

export default function GovernmentDashboard() {
  const { complaints, updateStatus } = useComplaints();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [rightSearch, setRightSearch] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { role: 'bot', text: 'Hello! I can help you summarize complaints, check statuses, or answer questions about the system.' },
  ]);
  const [aiInput, setAiInput] = useState('');

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    inProgress: complaints.filter((c) => c.status === 'In Progress').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    rejected: complaints.filter((c) => c.status === 'Rejected').length,
  };

  const filteredRight = complaints.filter((c) => {
    if (!rightSearch) return true;
    const q = rightSearch.toLowerCase();
    return c.id?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.citizenName?.toLowerCase().includes(q);
  });

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const question = aiInput.trim();
    setAiMessages((prev) => [...prev, { role: 'user', text: question }]);
    setAiInput('');
    const qLower = question.toLowerCase();
    let response = '';
    if (qLower.includes('summary') || qLower.includes('summarize')) {
      response = `Currently there are ${stats.total} complaints: ${stats.pending} pending, ${stats.inProgress} in progress, ${stats.resolved} resolved, and ${stats.rejected} rejected.`;
    } else if (qLower.includes('pending')) {
      response = `There are ${stats.pending} pending complaints that need attention.`;
    } else if (qLower.includes('resolved')) {
      response = `${stats.resolved} out of ${stats.total} complaints have been resolved (${stats.total ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0}%).`;
    } else if (qLower.includes('urgent')) {
      const urgent = complaints.filter((c) => c.priority === 'Urgent');
      response = `There are ${urgent.length} urgent complaints: ${urgent.map((c) => c.id).join(', ') || 'none'}.`;
    } else if (qLower.includes('help')) {
      response = 'You can ask: "summarize complaints", "how many pending?", "show urgent complaints", or "resolution rate".';
    } else {
      response = `There are ${stats.total} total complaints. ${stats.pending} pending, ${stats.resolved} resolved.`;
    }
    setTimeout(() => { setAiMessages((prev) => [...prev, { role: 'bot', text: response }]); }, 400);
  };

  const getMostCommonCategory = () => {
    const counts = {};
    complaints.forEach((c) => { counts[c.category] = (counts[c.category] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : '—';
  };

  const getAvgPerWard = () => {
    const wards = new Set(complaints.map((c) => c.ward).filter(Boolean));
    return wards.size ? (complaints.length / wards.size).toFixed(1) : '—';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-panel">
            <h3>Profile</h3>
            <p>Logged in as: <strong>{user?.email}</strong></p>
            <p>Name: <strong>{user?.name || '—'}</strong></p>
            <p>Role: {user?.role || 'Government Official'}</p>
          </div>
        );
      case 'settings':
        return (
          <div className="tab-panel">
            <h3>Settings</h3>
            <div className="settings-row"><label>Email Notifications</label><button className="settings-toggle on"></button></div>
            <div className="settings-row"><label>Auto-assign Complaints</label><button className="settings-toggle"></button></div>
            <div className="settings-row"><label>Dark Mode</label><button className="settings-toggle on"></button></div>
          </div>
        );
      case 'reports':
        return (
          <div className="tab-panel">
            <h3>Reports</h3>
            <p>View detailed complaint analytics and breakdowns.</p>
            <Link to="/reports" className="nav-link" style={{color: 'hsl(45, 100%, 55%)', padding: 0}}>Go to Full Reports →</Link>
          </div>
        );
      case 'analysis':
        return (
          <div className="tab-panel">
            <h3>Analysis</h3>
            <p>Resolution Rate: <strong>{stats.total ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0}%</strong></p>
            <p>Most common category: <strong>{getMostCommonCategory()}</strong></p>
            <p>Average complaints per ward: <strong>{getAvgPerWard()}</strong></p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      <div className="stats-row">
        <div className="stat-card"><div className="stat-card-header"><div className="stat-icon total">📋</div><span className="stat-trend up">↑ active</span></div><div className="stat-number">{stats.total}</div><div className="stat-label">Total Complaints</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-icon pending">⏳</div></div><div className="stat-number">{stats.pending}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-icon progress">🔄</div></div><div className="stat-number">{stats.inProgress}</div><div className="stat-label">In Progress</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-icon resolved">✅</div></div><div className="stat-number">{stats.resolved}</div><div className="stat-label">Resolved</div></div>
      </div>
      <div className="recent-section">
        <div className="recent-header"><h3>Recent Complaints</h3></div>
        <div className="complaint-list">
          {complaints.slice(0, 6).map((c) => (
            <div className="complaint-item" key={c.id || c.complaint_number} onClick={() => setSelectedComplaint(c)}>
              <span className="complaint-item-id">{c.id || c.complaint_number}</span>
              <span className="complaint-item-desc">{c.description}</span>
              <span className={'complaint-item-status cis-' + c.status?.toLowerCase().replace(/\s/g, '')}>{c.status}</span>
            </div>
          ))}
          {complaints.length === 0 && <p style={{ padding: '1rem', color: '#9ca3af' }}>No complaints yet.</p>}
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-brand"><span className="nav-icon">🏛️</span><span>Grievance Management System</span></div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">Dashboard</Link>
          <Link to="/reports" className="nav-link">Reports</Link>
          <button className="theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
          <button className="nav-logout" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-body">
        <aside className="dash-sidebar">
          <div className="sidebar-label">Menu</div>
          {SIDEBAR_TABS.map((tab) => (
            <button key={tab.id} className={'sidebar-tab' + (activeTab === tab.id ? ' active' : '')} onClick={() => setActiveTab(tab.id)}>
              <span className="sidebar-tab-icon">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </aside>

        <main className="dash-main">
          <div className="welcome-section">
            <div className="welcome-badge">✓ Logged In</div>
            <h1 className="welcome-heading">Welcome back, <span>{user?.name || user?.email || 'Admin'}</span> 👋</h1>
            <p className="welcome-sub">Here's what's happening with grievances today.</p>
          </div>
          {renderTabContent()}
        </main>

        <aside className="dash-right">
          <div>
            <div className="right-section-title">Complaint Tracking</div>
            <div className="tracking-cards">
              <div className="tracking-card"><span className="tracking-label">Total</span><span className="tracking-count">{stats.total}</span></div>
              <div className="tracking-card"><span className="tracking-label">Pending</span><span className="tracking-count tc-pending">{stats.pending}</span></div>
              <div className="tracking-card"><span className="tracking-label">In Progress</span><span className="tracking-count tc-progress">{stats.inProgress}</span></div>
              <div className="tracking-card"><span className="tracking-label">Resolved</span><span className="tracking-count tc-resolved">{stats.resolved}</span></div>
              <div className="tracking-card"><span className="tracking-label">Rejected</span><span className="tracking-count tc-rejected">{stats.rejected}</span></div>
            </div>
          </div>
          <input className="right-search" placeholder="🔍 Search complaints..." value={rightSearch} onChange={(e) => setRightSearch(e.target.value)} />
          {rightSearch && (
            <div className="complaint-list">
              {filteredRight.slice(0, 4).map((c) => (
                <div className="complaint-item" key={c.id || c.complaint_number} onClick={() => setSelectedComplaint(c)}>
                  <span className="complaint-item-id">{c.id || c.complaint_number}</span>
                  <span className="complaint-item-desc">{c.description}</span>
                </div>
              ))}
            </div>
          )}
          <div className="ai-bot-section">
            <div className="ai-bot-header"><div className="ai-bot-dot"></div><span>AI Assistant</span></div>
            <div className="ai-bot-messages">
              {aiMessages.map((msg, i) => (<div key={i} className={'ai-msg ' + msg.role}>{msg.text}</div>))}
            </div>
            <div className="ai-bot-input-wrap">
              <input className="ai-bot-input" placeholder="Ask something..." value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSend()} />
              <button className="ai-bot-send" onClick={handleAiSend}>→</button>
            </div>
          </div>
        </aside>
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedComplaint(null)}>×</button>
            <h2>{selectedComplaint.id || selectedComplaint.complaint_number}</h2>
            <div className="modal-grid">
              <div><strong>Citizen:</strong> {selectedComplaint.citizenName || selectedComplaint.citizen_email}</div>
              <div><strong>Email:</strong> {selectedComplaint.citizen_email}</div>
              <div><strong>Date:</strong> {selectedComplaint.date}</div>
              <div><strong>Category:</strong> {selectedComplaint.category}</div>
              <div><strong>Priority:</strong> {selectedComplaint.priority}</div>
              <div><strong>Location:</strong> {selectedComplaint.location}</div>
              <div><strong>Ward:</strong> {selectedComplaint.ward || '—'}</div>
              <div><strong>Sentiment:</strong> {selectedComplaint.sentiment}</div>
              <div>
                <strong>Status:</strong>
                <select
                  value={selectedComplaint.status}
                  onChange={(e) => { updateStatus(selectedComplaint.id || selectedComplaint.complaint_number, e.target.value); setSelectedComplaint({ ...selectedComplaint, status: e.target.value }); }}
                  style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-desc"><strong>Description:</strong><p>{selectedComplaint.description}</p></div>
            {selectedComplaint.history && selectedComplaint.history.length > 0 && (
              <div className="modal-timeline">
                <strong>Status Timeline</strong>
                <div className="timeline">
                  {selectedComplaint.history.map((entry, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className="timeline-dot-wrap">
                        <div className={'timeline-dot dot-' + entry.status?.toLowerCase().replace(/\s/g, '')}></div>
                        {idx < selectedComplaint.history.length - 1 && <div className="timeline-line"></div>}
                      </div>
                      <div className="timeline-content">
                        <span className={'timeline-status status-' + entry.status?.toLowerCase().replace(/\s/g, '')}>{entry.status}</span>
                        <span className="timeline-note">{entry.note}</span>
                        <span className="timeline-time">{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedComplaint.imageUrl && (
              <div className="modal-image"><img src={selectedComplaint.imageUrl} alt="Complaint evidence" /></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
