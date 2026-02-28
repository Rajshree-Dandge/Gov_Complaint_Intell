import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './CitizenLogin.css';

export default function CitizenLogin() {
  const navigate = useNavigate();
  const { citizenLogin, error } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({ name: '', identityNumber: '', phone: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (citizenLogin(form.name, form.identityNumber, form.phone)) {
      navigate('/citizen');
    }
  };

  return (
    <div className="citizen-login-page">
      <div className="citizen-login-card">
        <div className="citizen-login-header">
          <span className="citizen-login-emblem">👤</span>
          <h1>Citizen Portal</h1>
          <p>Sign in to file and track your grievances</p>
        </div>

        <form className="citizen-login-form" onSubmit={handleSubmit}>
          {error && <div className="citizen-login-error">{error}</div>}

          <div className="citizen-login-field">
            <label>Full Name <span className="req">*</span></label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="citizen-login-field">
            <label>Unique Identity Number <span className="req">*</span></label>
            <input
              type="text"
              name="identityNumber"
              value={form.identityNumber}
              onChange={handleChange}
              placeholder="Aadhaar / Voter ID number"
              required
            />
            <small className="field-hint">Enter your 12-digit Aadhaar or Voter ID</small>
          </div>

          <div className="citizen-login-field">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <button type="submit" className="btn-citizen-login">Sign In as Citizen</button>

          <div className="citizen-demo-note">
            <strong>Demo:</strong> Enter any name and a 12-digit identity number
          </div>
        </form>

        <div className="citizen-login-footer">
          <Link to="/select-role">← Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
}
