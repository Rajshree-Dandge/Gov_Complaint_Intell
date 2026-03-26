import React, { useState, useMemo } from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import './GovernmentLanding.css';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved', 'Rejected'];

const CATEGORIES = [
  { key: 'Roads & Infrastructure', name: 'Roads & Infra', icon: '🛣️', dbMatch: ['Roads & Infrastructure', 'Roads', 'Infrastructure'] },
  { key: 'Water Leakage', name: 'Water Leakage', icon: '💧', dbMatch: ['Water Leakage', 'Water', 'Water Supply'] },
  { key: 'Electricity', name: 'Electricity', icon: '⚡', dbMatch: ['Electricity', 'Electrical'] },
  { key: 'Garbage', name: 'Garbage', icon: '🗑️', dbMatch: ['Garbage', 'Sanitation', 'Waste', 'Sanitation & Waste'] },
];

const SIDEBAR_TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'reports', label: 'Reports', icon: '📈' },
  { id: 'analysis', label: 'Analysis', icon: '🔍' },
];

const TIME_FILTERS = ['Today', 'Monthly', 'Yearly'];

function filterByTime(complaints, timeFilter) {
  const now = new Date();
  return complaints.filter(c => {
    const d = new Date(c.created_at || c.date);
    if (isNaN(d)) return true;
    if (timeFilter === 'Today') {
      return d.toDateString() === now.toDateString();
    }
    if (timeFilter === 'Monthly') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'Yearly') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });
}

function matchesCategory(complaint, category) {
  const cat = (complaint.category || '').toLowerCase();
  return category.dbMatch.some(m => cat === m.toLowerCase());
}

export default function GovernmentDashboard() {
  const { complaints, updateStatus } = useComplaints();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [timeFilter, setTimeFilter] = useState('Monthly');
  const [rightSearch, setRightSearch] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { role: 'bot', text: 'Hello! I can help you summarize complaints, check statuses, or answer questions about the system. Try asking me something!' },
  ]);
  const [aiInput, setAiInput] = useState('');

  // Compute stats based on context (overall or category-specific) + time filter
  const relevantComplaints = useMemo(() => {
    let filtered = complaints;
    if (selectedCategory) {
      filtered = filtered.filter(c => matchesCategory(c, selectedCategory));
    }
    return filterByTime(filtered, timeFilter);
  }, [complaints, selectedCategory, timeFilter]);

  const stats = useMemo(() => ({
    total: relevantComplaints.length,
    pending: relevantComplaints.filter(c => c.status === 'Pending').length,
    inProgress: relevantComplaints.filter(c => c.status === 'In Progress').length,
    resolved: relevantComplaints.filter(c => c.status === 'Resolved').length,
    rejected: relevantComplaints.filter(c => c.status === 'Rejected').length,
  }), [relevantComplaints]);

  // Category counts for cards (always use all complaints, no time filter for card counts)
  const categoryCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(cat => {
      counts[cat.key] = complaints.filter(c => matchesCategory(c, cat)).length;
    });
    return counts;
  }, [complaints]);

  // Search filter for right sidebar
  const filteredRight = useMemo(() => {
    if (!rightSearch) return [];
    const q = rightSearch.toLowerCase();
    return complaints.filter(c => {
      const id = (c.id || c.complaint_number || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const name = (c.citizenName || c.citizen_name || c.citizen_email || '').toLowerCase();
      return id.includes(q) || desc.includes(q) || name.includes(q);
    });
  }, [complaints, rightSearch]);

  // Analysis helpers
  const getMostCommonCategory = () => {
    const counts = {};
    complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : '—';
  };

  const getAvgPerWard = () => {
    const wards = new Set(complaints.map(c => c.ward).filter(Boolean));
    return wards.size ? (complaints.length / wards.size).toFixed(1) : '—';
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const question = aiInput.trim();
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    setAiInput('');
    const qLower = question.toLowerCase();
    let response = '';
    if (qLower.includes('summary') || qLower.includes('summarize')) {
      response = `Currently: ${stats.total} complaints — ${stats.pending} pending, ${stats.inProgress} in progress, ${stats.resolved} resolved, ${stats.rejected} rejected.`;
    } else if (qLower.includes('pending')) {
      response = `There are ${stats.pending} pending complaints that need attention.`;
    } else if (qLower.includes('resolved')) {
      response = `${stats.resolved} out of ${stats.total} resolved (${stats.total ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0}%).`;
    } else if (qLower.includes('urgent')) {
      const urgent = complaints.filter(c => (c.priority || '').toLowerCase() === 'urgent');
      response = `There are ${urgent.length} urgent complaints: ${urgent.map(c => c.id || c.complaint_number).join(', ') || 'none'}.`;
    } else if (qLower.includes('help') || qLower.includes('what can')) {
      response = 'You can ask me: "summarize complaints", "how many pending?", "show urgent complaints", or "resolution rate".';
    } else {
      response = `Total: ${stats.total}. Pending: ${stats.pending}. In Progress: ${stats.inProgress}. Resolved: ${stats.resolved}. Rejected: ${stats.rejected}.`;
    }
    setTimeout(() => setAiMessages(prev => [...prev, { role: 'bot', text: response }]), 400);
  };

  const getPriorityClass = (priority) => {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent' || p === 'critical') return 'critical';
    if (p === 'high') return 'high';
    if (p === 'low') return 'low';
    return 'medium';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="tab-panel">
            <h3>Profile</h3>
            <p>Logged in as: <strong>{user?.email}</strong></p>
            <p>Name: <strong>{user?.name || '—'}</strong></p>
            <p>Role: Government Official</p>
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
            <Link to="/reports" className="nav-link" style={{ color: 'var(--accent-teal)', padding: 0 }}>Go to Full Reports →</Link>
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
        return selectedCategory ? renderCategoryTable() : renderCategoryCards();
    }
  };

  const renderCategoryCards = () => (
    <>
      <div className="category-grid">
        {CATEGORIES.map(cat => (
          <div className="category-card" key={cat.key} onClick={() => { setSelectedCategory(cat); setActiveTab('overview'); }}>
            <span className="category-card-live">LIVE</span>
            <div className="category-card-icon">{cat.icon}</div>
            <div className="category-card-name">{cat.name}</div>
            <div className="category-card-count">{categoryCounts[cat.key] || 0}</div>
            <div className="category-card-label">Active Grievances</div>
            <button className="category-card-btn" onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); setActiveTab('overview'); }}>
              Access Desk 1 →
            </button>
          </div>
        ))}
        {/* AI Heatmap Card */}
        <div className="heatmap-card">
          <div className="heatmap-card-title">🗺️ AI Heatmap Reflector</div>
          <div className="heatmap-card-sub">DBSCAN Clustering Active</div>
          <span className="heatmap-badge">🔍 Map Loading…</span>
        </div>
      </div>
    </>
  );

  const renderCategoryTable = () => {
    const catComplaints = complaints.filter(c => matchesCategory(c, selectedCategory));
    return (
      <div className="category-table-view">
        <button className="category-back-btn" onClick={() => setSelectedCategory(null)}>
          ← Back to Command Center
        </button>
        <h2 className="category-table-title">{selectedCategory.name} Intelligence Dashboard</h2>
        <p className="category-table-sub">
          Showing verified results for <strong>{user?.ward || user?.zone || 'All Wards'}</strong>
        </p>
        <table className="complaints-table">
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
            {catComplaints.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">No complaints in this category.</td></tr>
            ) : (
              catComplaints.map(c => (
                <tr key={c.id || c.complaint_number}>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(c.priority)}`}>
                      {(c.priority || 'Medium').toUpperCase()}
                    </span>
                  </td>
                  <td>{c.citizenName || c.citizen_name || c.citizen_email}</td>
                  <td>{c.ai_score ? `${c.ai_score}/10` : '4.2/10'}</td>
                  <td>{c.location}</td>
                  <td>
                    <button className="table-action-btn" onClick={() => setSelectedComplaint(c)}>Evidence</button>
                    {c.status !== 'Resolved' && (
                      <button className="table-action-btn resolve" onClick={() => updateStatus(c.id || c.complaint_number, 'Resolved')}>Resolve</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const userZone = user?.ward || user?.zone || 'Ward 1';

  return (
    <div className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-brand"><span className="nav-icon">🏛️</span><span>Grievance Management System</span></div>
        <div className="nav-links">
          <Link to="/dashboard/:category" className="nav-link active">Dashboard</Link>
          <Link to="/reports" className="nav-link">Reports</Link>
          <Link to="/" className="nav-link">Citizen Portal</Link>
          <button className="theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
          <button className="nav-logout" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-body">
        {/* Left Sidebar */}
        <aside className="dash-sidebar">
          <div className="sidebar-label">Menu</div>
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.id}
              className={'sidebar-tab' + (activeTab === tab.id ? ' active' : '')}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'overview') setSelectedCategory(null); }}
            >
              <span className="sidebar-tab-icon">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </aside>

        {/* Middle Content */}
        <main className="dash-main">
          <div className="welcome-section">
            <div className="welcome-badge">✓ Logged In</div>
            <h1 className="welcome-heading">Welcome back, <span>{user?.name || user?.email || 'Admin'}</span> 👋</h1>
            <div className="zone-badge">Operating Zone: {userZone}</div>
            <p className="welcome-sub">Select a department to view verified grievances and the AI Severity Heatmap.</p>
          </div>
          {renderTabContent()}
        </main>

        {/* Right Sidebar */}
        <aside className="dash-right">
          <div>
            <div className="right-section-title">
              {selectedCategory ? `${selectedCategory.name} Statistics` : '📊 Complaint Tracking'}
            </div>
            <div className="time-filter">
              {TIME_FILTERS.map(tf => (
                <button key={tf} className={`time-filter-btn${timeFilter === tf ? ' active' : ''}`} onClick={() => setTimeFilter(tf)}>
                  {tf}
                </button>
              ))}
            </div>
            <div className="tracking-cards">
              <div className="tracking-card"><span className="tracking-label">Total</span><span className="tracking-count">{stats.total}</span></div>
              <div className="tracking-card"><span className="tracking-label">Pending</span><span className="tracking-count tc-pending">{stats.pending}</span></div>
              <div className="tracking-card"><span className="tracking-label">In Progress</span><span className="tracking-count tc-progress">{stats.inProgress}</span></div>
              <div className="tracking-card"><span className="tracking-label">Resolved</span><span className="tracking-count tc-resolved">{stats.resolved}</span></div>
              <div className="tracking-card"><span className="tracking-label">Rejected</span><span className="tracking-count tc-rejected">{stats.rejected}</span></div>
            </div>
          </div>

          <input
            className="right-search"
            placeholder="🔍 Search complaints..."
            value={rightSearch}
            onChange={e => setRightSearch(e.target.value)}
          />

          {rightSearch && (
            <div className="right-search-results">
              {filteredRight.slice(0, 4).map(c => (
                <div className="complaint-item" key={c.id || c.complaint_number} onClick={() => setSelectedComplaint(c)}>
                  <span className="complaint-item-id">{c.id || c.complaint_number}</span>
                  <span className="complaint-item-desc">{c.description}</span>
                </div>
              ))}
              {filteredRight.length === 0 && <div className="search-empty">No results found.</div>}
            </div>
          )}

          <div className="ai-bot-section">
            <div className="ai-bot-header"><div className="ai-bot-dot"></div><span>AI Assistant</span></div>
            <div className="ai-bot-messages">
              {aiMessages.map((msg, i) => (<div key={i} className={'ai-msg ' + msg.role}>{msg.text}</div>))}
            </div>
            <div className="ai-bot-input-wrap">
              <input className="ai-bot-input" placeholder="Ask something..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAiSend()} />
              <button className="ai-bot-send" onClick={handleAiSend}>→</button>
            </div>
          </div>
        </aside>
      </div>

      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedComplaint(null)}>×</button>
            <h2>{selectedComplaint.id || selectedComplaint.complaint_number}</h2>
            <div className="modal-grid">
              <div><strong>Citizen:</strong> {selectedComplaint.citizenName || selectedComplaint.citizen_name || selectedComplaint.citizen_email}</div>
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
                  onChange={e => { updateStatus(selectedComplaint.id || selectedComplaint.complaint_number, e.target.value); setSelectedComplaint({ ...selectedComplaint, status: e.target.value }); }}
                  className="modal-status-select"
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
