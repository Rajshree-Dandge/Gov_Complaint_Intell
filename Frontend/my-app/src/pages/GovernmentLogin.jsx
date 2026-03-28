import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './GovernmentLogin.css';
import axios from 'axios';

export default function GovernmentLogin() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ward, setWard] = useState('Ward 1');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Prepare the credentials to send to the Backend
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      formData.append("ward", ward); // Sending the ward so the backend knows where this officer belongs

      // 2. CALL THE LOGIN ENDPOINT (Not get-complaints!)
      const res = await axios.post("http://127.0.0.1:8000/login", formData);

      // 3. CHECK IF LOGIN WAS SUCCESSFUL
      if (res.data.status === "success") {
        // A. Save the "Digital Key" (Token) returned by Python
        localStorage.setItem("token", res.data.access_token);

        // B. Save the Ward and Username for the UI
        localStorage.setItem("gov_ward", ward);
        localStorage.setItem("gov_user", username);

        console.log("Login Successful! Token Saved.");

        // C. Navigate to the landing page now that we are "Authenticated"
        navigate('/gov-landing');
      } else {
        alert("Login Failed: " + res.data.message);
      }

    } catch (err) {
      console.error("Auth Error:", err);
      alert("Could not connect to Government Auth Server.");
    }
  };
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-emblem">🏛️</span>
          <h1>Government Portal</h1>
          <p>Sign in to access the Grievance Dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <div className="login-field">
            <label>Select Your Ward / Zone</label>
            <select value={ward} onChange={(e) => setWard(e.target.value)}>
              <option value="Ward 1">Ward 1 - South Hub</option>
              <option value="Ward 2">Ward 2 - East Sector</option>
              <option value="Ward 5">Ward 5 - MG Road Area</option>
            </select>
          </div>

          <button type="submit" className="btn-login">Sign In</button>

          <div className="login-demo-note">
            <strong>Demo credentials:</strong> admin / admin123
          </div>
        </form>

        <div className="login-footer">
          <Link to="/select-role">← Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
}
