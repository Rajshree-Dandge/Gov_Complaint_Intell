import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './ManualPage.css';

const FEATURES = [
  {
    icon: '📝',
    title: 'Submit Grievances',
    desc: 'Citizens can file complaints with photo evidence, location details, and multilingual descriptions.',
  },
  {
    icon: '📊',
    title: 'Government Dashboard',
    desc: 'Officials get a real-time overview of all complaints with status tracking, analytics, and AI assistance.',
  },
  {
    icon: '🔄',
    title: 'Status Tracking',
    desc: 'Every complaint has a detailed timeline showing its journey from submission to resolution.',
  },
  {
    icon: '🌐',
    title: 'Multilingual Support',
    desc: 'File complaints in 11+ Indian languages including Hindi, Tamil, Telugu, Bengali, and more.',
  },
  {
    icon: '📈',
    title: 'Reports & Analysis',
    desc: 'Comprehensive analytics with charts, category breakdowns, ward-wise distribution, and trend analysis.',
  },
  {
    icon: '🤖',
    title: 'AI Assistant',
    desc: 'Built-in AI bot helps officials summarize data, check statuses, and answer system queries instantly.',
  },
];

const FLOW_STEPS = [
  { step: '1', title: 'Choose Role', desc: 'Select whether you are a Citizen or Government Official.' },
  { step: '2', title: 'Sign In', desc: 'Authenticate with your credentials based on your role.' },
  { step: '3', title: 'Take Action', desc: 'Citizens submit complaints; Officials manage and resolve them.' },
  { step: '4', title: 'Track Progress', desc: 'Monitor complaint status with real-time updates and timelines.' },
];

export default function ManualPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();



  return (
    <div className="manual-page">
      <nav className="manual-nav">
        <div className="manual-nav-brand">
          <span className="manual-nav-icon">🏛️</span>
          <span>Nivaran AI Governance</span>
        </div>
        <div className="manual-nav-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
          {/* REVOLUTIONARY: Direct Portal Entry */}
          <button className="btn-get-started" onClick={() => navigate('/citizen-login')}>Citizen Portal</button>
        </div>
      </nav>

      <section className="manual-hero">
        <div className="hero-badge">🇮🇳 Sovereign AI Initiative</div>
        <h1 className="hero-title">Automated Public<br />Triage System</h1>
        <p className="hero-subtitle">
          Bypassing administrative delay using YOLOv11 Verification and Multimodal NLP.
        </p>
        <div className="hero-buttons">
          {/* DIRECT NAVIGATION FIX */}
          <button className="btn-hero-primary" onClick={() => navigate('/citizen-login')}>Citizen Entry →</button>
          <button className="btn-hero-secondary" onClick={() => navigate('/login')}>Official Hub ↓</button>
        </div>
      </section>

      {/* ... (Keep Platforms Features section) ... */}

      <section className="manual-section roles-section">
        <h2 className="section-title">Select Your Doorway</h2>
        <div className="roles-grid">
          {/* CITIZEN CARD */}
          <div className="role-card citizen-role" onClick={() => navigate('/citizen-login')} style={{ cursor: 'pointer' }}>
            <div className="role-icon">👤</div>
            <h3>Citizens</h3>
            <ul>
              <li>Submit OTP-Verified Grievances</li>
              <li>Real-time AI Verification Stepper</li>
            </ul>
            <button className="role-btn-direct">Enter Citizen Portal →</button>
          </div>

          {/* GOVERNMENT CARD */}
          <div className="role-card gov-role" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
            <div className="role-icon">🏛️</div>
            <h3>Government Officials</h3>
            <ul>
              <li>DBSCAN Severity Heatmap</li>
              <li>Automated Administrative Triage</li>
            </ul>
            <button className="role-btn-direct" style={{ background: '#1E293B' }}>Access Command Center →</button>
          </div>
        </div>
      </section>


      <footer className="manual-footer">
        <p>© 2026 Public Grievance Management System — Government of India</p>
      </footer>
    </div>
  );
}
