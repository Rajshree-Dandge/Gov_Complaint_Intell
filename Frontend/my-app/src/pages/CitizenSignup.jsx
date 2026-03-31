import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

export default function CitizenSignup() {
  const navigate = useNavigate();
  const { signUpWithEmail, error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Workflow States
  const [step, setStep] = useState('verification'); // 'verification' or 'details'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', uid: '', password: '', confirmPassword: '',
  });

  // Handle OTP Resend Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 1. Request OTP from FastAPI Backend
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.phone) {
      setError('Please fill Name, Email, and Phone to receive a verification code');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
          email: form.email.trim(),
          name: form.name.trim(),
          role: 'citizen',
          is_signup: true // <--- THIS WAS MISSING
        }),
      });

      if (!response.ok) throw new Error('Failed to send OTP. Please try again.');

      setOtpSent(true);
      setOtpTimer(60); // 60 seconds until resend allowed
      setSuccessMsg('A 6-digit code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Please enter the 6-digit code');

    setSubmitting(true);
    setError('');
    try {
      const verifyRes = await fetch('http://localhost:8000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), code: otp.trim() }),
      });

      if (!verifyRes.ok) throw new Error('Invalid or expired OTP');

      setIsVerified(true);
      setStep('details');
      setSuccessMsg('Email verified! Please complete your profile.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Final Form Submission (Firebase + Python Backend)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');

    setSubmitting(true);
    try {
      // Direct Python Backend Registration (FastAPI)
      const dbResponse = await fetch('http://localhost:8000/register/citizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          uid_number: form.uid || "N/A",
          password: form.password,
        }),
      });

      if (!dbResponse.ok) {
        const result = await dbResponse.json();
        throw new Error(result.detail || 'Database registration failed');
      }

      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/citizen-login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-emblem">👤</span>
          <h1>Citizen Registration</h1>
          <p>{step === 'verification' ? 'Verify your identity to start' : 'Secure your account'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {step === 'verification' ? (
          <form className="auth-form" onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
            <div className="auth-field">
              <label>Full Name <span className="req">*</span></label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" required disabled={otpSent} />
            </div>
            <div className="auth-field">
              <label>Email <span className="req">*</span></label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email address" required disabled={otpSent} />
            </div>
            <div className="auth-field">
              <label>Phone Number <span className="req">*</span></label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" required disabled={otpSent} />
            </div>

            {otpSent && (
              <div className="otp-container">
                <label>Verification Code</label>
                <input 
                  type="text" 
                  className="otp-input-large" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                />
                <div className="otp-resend">
                  {otpTimer > 0 ? (
                    <span>Resend code in {otpTimer}s</span>
                  ) : (
                    <button type="button" onClick={handleRequestOtp}>Resend Code</button>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="btn-auth" disabled={submitting}>
              {otpSent ? (submitting ? 'Verifying...' : 'Verify Code') : (submitting ? 'Sending...' : 'Send OTP')}
            </button>
          </form>
        ) : (
          /* STEP 2: PROFILE DETAILS */
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* <div className="auth-field">
              <label>Government Identity (Aadhaar/UID) <span className="req">*</span></label>
              <input type="text" name="uid" value={form.uid} onChange={handleChange} placeholder="Enter 12-digit UID" required maxLength={12} />
            </div>
             */}
            <div className="auth-row">
              <div className="auth-field">
                <label>Password <span className="req">*</span></label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
              </div>
              <div className="auth-field">
                <label>Confirm <span className="req">*</span></label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={submitting}>
              {submitting ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        <div className="auth-toggle">
          Already have an account?{' '}
          <button onClick={() => navigate('/citizen-login')}>Sign In</button>
        </div>

        <div className="auth-footer">
          <Link to="/select-role">← Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
}