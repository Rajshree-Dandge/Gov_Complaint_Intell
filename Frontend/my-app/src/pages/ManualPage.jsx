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
          <span>Grievance Management System</span>
        </div>
        <div className="manual-nav-actions">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {isDark ? '☀️' : '🌙'}
          </button>
          <button className="btn-get-started" onClick={() => navigate('/select-role')}>
            Get Started
          </button>
        </div>
      </nav>

      <section className="manual-hero">
        <div className="hero-badge">🇮🇳 Government of India Initiative</div>
        <h1 className="hero-title">Public Grievance<br />Management System</h1>
        <p className="hero-subtitle">
          A unified digital platform for citizens to voice their concerns and for
          government officials to efficiently track, manage, and resolve public grievances.
        </p>
        <div className="hero-buttons">
          <button className="btn-hero-primary" onClick={() => navigate('/select-role')}>
            Get Started →
          </button>
          <a href="#features" className="btn-hero-secondary">Learn More ↓</a>
        </div>
      </section>

      <section className="manual-section" id="features">
        <h2 className="section-title">Platform Features</h2>
        <p className="section-subtitle">Everything you need to manage public grievances effectively</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="manual-section flow-section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Simple 4-step process to get started</p>
        <div className="flow-grid">
          {FLOW_STEPS.map((s, i) => (
            <div className="flow-card" key={i}>
              <div className="flow-step-num">{s.step}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {i < FLOW_STEPS.length - 1 && <div className="flow-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="manual-section roles-section">
        <h2 className="section-title">Who Can Use This?</h2>
        <div className="roles-grid">
          <div className="role-card citizen-role">
            <div className="role-icon">👤</div>
            <h3>Citizens</h3>
            <ul>
              <li>Submit complaints with photo evidence</li>
              <li>Track complaint status in real-time</li>
              <li>Write in your preferred language</li>
              <li>Provide location and ward details</li>
            </ul>
            <p className="role-credential-note">
              <strong>Required:</strong> Unique Identity Number (Aadhaar/Voter ID)
            </p>
          </div>
          <div className="role-card gov-role">
            <div className="role-icon">🏛️</div>
            <h3>Government Officials</h3>
            <ul>
              <li>View and manage all complaints</li>
              <li>Update complaint statuses</li>
              <li>Generate reports and analytics</li>
              <li>Use AI assistant for insights</li>
            </ul>
            <p className="role-credential-note">
              <strong>Required:</strong> Official Government ID & Credentials
            </p>
          </div>
        </div>
      </section>

      <section className="manual-cta">
        <h2>Ready to Make a Difference?</h2>
        <p>Join the platform and help build a better community.</p>
        <button className="btn-hero-primary" onClick={() => navigate('/select-role')}>
          Sign In / Get Started →
        </button>
      </section>

      <footer className="manual-footer">
        <p>© 2026 Public Grievance Management System — Government of India</p>
      </footer>
    </div>
  );
}
