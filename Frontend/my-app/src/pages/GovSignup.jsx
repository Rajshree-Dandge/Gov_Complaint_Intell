
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

export default function GovSignup() {
  const navigate = useNavigate();
  const { error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileRef = useRef(null);

  // States for multi-step flow
  const [step, setStep] = useState('verification'); // verification -> location -> roles -> documents
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [proofFile, setProofFile] = useState(null);
  
  const [form, setForm] = useState({
    name: '', email: '', phone: '', uid: '', password: '', confirmPassword: '',
    location: '', role: 'government', designation: '' // Ensure default role is set
  });

  const rolesList = ['Sarpanch', 'Desk 1 Officer', 'Desk 2 Officer', 'Gram Sevak', 'Tehsildar'];

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // --- UPDATED: Get Current Location with Permission Dialog ---
  const handleGetLocation = () => {
    setError('');
    setSuccessMsg('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          const coords = `${lat}, ${lng}`;
          
          setForm({ ...form, location: coords });
          setSuccessMsg("Location captured successfully.");
        },
        (err) => {
          if (err.code === 1) {
            setError("Permission denied. Please allow location access in browser settings.");
          } else {
            setError("Unable to retrieve location. Please check your GPS/Network.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8001/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), name: form.name.trim(), role: 'government', is_signup: true }),
      });
      if (!response.ok) throw new Error('Failed to send OTP');
      setOtpSent(true);
      setOtpTimer(60);
      setSuccessMsg('OTP sent to your email.');
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const verifyRes = await fetch('http://localhost:8001/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), code: otp.trim() }),
      });
      if (!verifyRes.ok) throw new Error('Invalid OTP');
      setStep('location');
      setSuccessMsg('');
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  // --- UPDATED: handleSubmitFinal to match Backend Form Fields exactly ---
  const handleSubmitFinal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      
      // Explicitly append fields to avoid sending unnecessary data (like confirmPassword)
      // and ensure keys match Python backend: async def register_gov(name, email, phone, location, designation, uid, password, proof)
      formData.append('name', form.name.trim());
      formData.append('email', form.email.trim());
      formData.append('phone', form.phone || "Not Provided"); 
      formData.append('location', form.location);
      formData.append('designation', form.designation);
      formData.append('uid', form.uid.trim());
      formData.append('password', form.password);
      
      if (proofFile) {
        formData.append('proof', proofFile);
      } else {
        throw new Error("Please upload a proof document.");
      }

      const response = await fetch('http://localhost:8001/register/government', {
        method: 'POST',
        // IMPORTANT: Do NOT set headers manually for FormData; fetch sets boundary automatically
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Registration failed');
      }

      setSuccessMsg('Registration Complete!');
      setTimeout(() => navigate('/govLanding'), 2000);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>

      <div className="auth-card auth-card-wide overflow-hidden">
        <div className="auth-header">
          <span className="auth-emblem">🏛️</span>
          <h1>Government Registration</h1>
          <p>{step === 'verification' ? 'Verify Identity' : step === 'location' ? 'Office Details' : 'Finalize Profile'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <div className="step-container">
          {step === 'verification' && (
            <div className="step-slide-in">
              <form className="auth-form" onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
                <div className="auth-field"><label>Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required disabled={otpSent} /></div>
                <div className="auth-field"><label>Official Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={otpSent} /></div>
                {otpSent && (
                  <input type="text" className="otp-input-large" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" />
                )}
                <button type="submit" className="btn-auth" disabled={submitting}>
                  {otpSent ? (submitting ? 'Verifying...' : 'Verify OTP') : (submitting ? 'Sending...' : 'Send OTP')}
                </button>
              </form>
            </div>
          )}

          {step === 'location' && (
            <div className="step-slide-in">
              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setStep('roles'); }}>
                <div className="auth-field">
                  <label>Office Location (GPS Captured)</label>
                  <div className="location-box" style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={form.location} 
                      placeholder="Latitude, Longitude" 
                      readOnly 
                      required
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      onClick={handleGetLocation} 
                      className="btn-location"
                      style={{ padding: '0 15px', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      📍 Get Location
                    </button>
                  </div>
                </div>
                <div className="auth-field"><label>Identity UID (Aadhaar/Service ID)</label>
                <input type="text" name="uid" value={form.uid} onChange={handleChange} required /></div>
                <button type="submit" className="btn-auth" disabled={!form.location}>Proceed Further</button>
              </form>
            </div>
          )}

          {step === 'roles' && (
            <div className="step-slide-in">
              <div className="gov-post-grid">
                {rolesList.map(r => (
                  <button key={r} type="button" className={`post-btn ${form.designation === r ? 'active' : ''}`} 
                    onClick={() => setForm({...form, designation: r})}>{r}</button>
                ))}
              </div>
              <button onClick={() => setStep('documents')} className="btn-auth" disabled={!form.designation}>Confirm Role</button>
            </div>
          )}

          {step === 'documents' && (
            <div className="step-slide-in">
              <form className="auth-form" onSubmit={handleSubmitFinal}>
                <div className="auth-field">
                  <label>Upload Official Appointment Letter / ID</label>
                  <input type="file" onChange={(e) => setProofFile(e.target.files[0])} required />
                </div>
                <div className="auth-field"><label>Set Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required /></div>
                <button type="submit" className="btn-auth" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="auth-footer">
          <Link to="/select-role">← Back</Link>
        </div>
      </div>
    </div>
  );
}