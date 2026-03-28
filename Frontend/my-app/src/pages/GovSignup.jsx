import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

export default function GovSignup() {
  const navigate = useNavigate();
  const { error, setError } = useAuth(); // Keep hook structure exactly the same
  const { isDark, toggleTheme } = useTheme();
  const fileRef = useRef(null);

  // States for OTP and flow
  const [step, setStep] = useState('verification'); 
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', ward: '', uid: '', password: '', confirmPassword: '',
  });

  // Handle Resend Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) setProofFile(file);
    else setError('File must be under 10MB');
  };

  // Trigger Backend to send OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.phone) {
      setError('Please fill Name, Email, and Phone to receive OTP');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8001/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
          email: form.email.trim(),
          name: form.name.trim(),
          role: 'government',
          is_signup: true // <--- THIS WAS MISSING
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Failed to send OTP');

      setOtpSent(true);
      setOtpTimer(60); 
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  
  // Verify the OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter the 6-digit code');

    setSubmitting(true);
    setError('');
    try {
      const verifyRes = await fetch('http://localhost:8001/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), code: otp.trim() }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.detail || 'Invalid or expired OTP');

      setIsVerified(true);
      setStep('details'); 
      setSuccessMsg('Email verified successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!proofFile) return setError('Proof of government employment is required');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setSubmitting(true);
    try {
      // Logic Fix: We send directly to Python Backend (SQLite)
      // Removing the Firebase signUpWithEmail block to avoid 400 conflict
      
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('ward', form.ward);
      formData.append('uid', form.uid); 
      formData.append('password', form.password);
      formData.append('proof', proofFile);

      const response = await fetch('http://localhost:8001/register/government', { 
      method: 'POST',
      body: formData,
    });

      const result = await response.json();
      
      if (!response.ok) {
        // Handle FastAPI validation errors (422) clearly
        const errorDetail = result.detail;
        throw new Error(typeof errorDetail === 'string' ? errorDetail : 'Registration failed: Check all fields');
      }

      setSuccessMsg('Registration submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message); // Fixes [object Object] by ensuring it's a string
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>

      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-emblem">🏛️</span>
          <h1>Government Registration</h1>
          <p>Verify your official identity to proceed</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {/* STEP 1: VERIFICATION */}
        {step === 'verification' ? (
          <form className="auth-form" onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
            <div className="auth-row">
              <div className="auth-field">
                <label>Full Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required disabled={otpSent} />
              </div>
              <div className="auth-field">
                <label>Official Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required disabled={otpSent} />
              </div>
            </div>
            
            <div className="auth-field">
                <label>Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} required disabled={otpSent} />
            </div>

            {otpSent && (
              <div className="otp-section">
                <label>Verification Code</label>
                <input 
                  type="text" 
                  className="otp-input-large" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
                <div className="otp-resend">
                   {otpTimer > 0 ? (
                     <span>Resend in {otpTimer}s</span>
                   ) : (
                     <button type="button" onClick={handleRequestOtp}>Resend Code</button>
                   )}
                </div>
              </div>
            )}

            <button type="submit" className="btn-auth" disabled={submitting}>
              {otpSent ? (submitting ? 'Verifying...' : 'Verify OTP') : (submitting ? 'Sending...' : 'Send Verification OTP')}
            </button>
          </form>
        ) : (
          /* STEP 2: PROFILE DETAILS */
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-row">
               <div className="auth-field"><label>Ward Number</label>
               <input type="text" name="ward" value={form.ward} onChange={handleChange} required /></div>
               <div className="auth-field"><label>Identity UID</label>
               <input type="text" name="uid" value={form.uid} onChange={handleChange} required /></div>
            </div>

            <div className="auth-field">
              <label>Proof of Employment (ID Card)</label>
              <div className="proof-upload" onClick={() => fileRef.current?.click()}>
                {proofFile ? <p>📎 {proofFile.name}</p> : <p>📄 Click to upload ID proof</p>}
                <input ref={fileRef} type="file" onChange={handleFileChange} hidden />
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field"><label>Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required /></div>
              <div className="auth-field"><label>Confirm</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required /></div>
            </div>

            <button type="submit" className="btn-auth" disabled={submitting}>Complete Registration</button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/select-role">← Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
}