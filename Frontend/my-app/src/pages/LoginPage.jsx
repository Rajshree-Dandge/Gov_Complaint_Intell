import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

export default function LoginPage({ defaultRole = 'citizen' }) {
  const navigate = useNavigate();
  const { login, error, setError } = useAuth(); // Renamed setLocalUser to login
  const { isDark, toggleTheme } = useTheme();
  
  const [step, setStep] = useState('credentials'); 
  const [email, setEmail] = useState('');
  const [name, setName] = useState(''); 
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');

  const signupPath = defaultRole === 'government' ? '/gov-signup' : '/citizen-signup';

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) {
        setError('Please enter both Name and Email');
        return;
    }
    
    setSubmitting(true);
    setError('');
    try {
        const response = await fetch('http://localhost:8000/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
      email: email.trim(), 
      name: name.trim(),
      role: defaultRole,
      is_signup: false
  }),
});

        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Failed to send OTP');

        setStep('otp');
        setOtpTimer(60);
        setSuccessMsg(`User verified as ${defaultRole}. OTP sent to email.`);
    } catch (err) {
        setError(err.message);
    } finally {
        setSubmitting(false);
    }
};

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter 6-digit code');

    setSubmitting(true);
    setError('');
    try {
      const verifyRes = await fetch('http://localhost:8000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
      });

      const result = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(result.detail || 'Invalid OTP');

      const finalRole = result.role.trim().toLowerCase();
      // Update Auth State using the new login function (userData, token)
      login({
        email: email.trim(),
        name: name.trim(),
        role: finalRole,
        ward: result.ward || "General" // Some users might have wards
      }, result.token);

      setSuccessMsg('Login Successful!');
      
      setTimeout(() => {
          if (finalRole === 'government') {
            navigate('/dashboard');
          } else if (finalRole === 'citizen') {
            navigate('/citizen');
          } else {
            setError('Unknown user role. Contact support.');
          }
      }, 1000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const icon = defaultRole === 'government' ? '🏛️' : '👤';
  const title = defaultRole === 'government' ? 'Government Login' : 'Citizen Login';

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme}>
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-emblem">{icon}</span>
          <h1>{title}</h1>
          <p>Secure Access via OTP</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        {step === 'credentials' ? (
          <form className="auth-form" onSubmit={handleRequestOtp}>
            <div className="auth-field">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Enter registered name" 
                required 
              />
            </div>
            <div className="auth-field">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="registered@email.com" 
                required 
              />
            </div>
            <button type="submit" className="btn-auth" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Send Login OTP'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleVerifyAndLogin}>
            <div className="otp-info">
              <p>Enter the code sent to <strong>{email}</strong></p>
            </div>
            <div className="auth-field">
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="otp-input-large"
                required
              />
            </div>
            <button type="submit" className="btn-auth" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <div className="otp-resend">
              {otpTimer > 0 ? (
                <span>Resend in {otpTimer}s</span>
              ) : (
                <button type="button" onClick={handleRequestOtp}>Resend Code</button>
              )}
            </div>
          </form>
        )}
        <div className='auth-toggle'>
          Don't have an account?
          <button onClick={()=>{navigate(signupPath)}}>Sign Up</button>
        </div>
        <div className="auth-footer">
          <Link to="/select-role">← Back to Role Selection</Link>
        </div>
      </div>
    </div>
  );
}