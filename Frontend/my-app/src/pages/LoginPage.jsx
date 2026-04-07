import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import './AuthPage.css';
import { toast } from 'sonner';

export default function LoginPage({ defaultRole }) {
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
      // SYSTEMS ARCHITECT: Axios Timeout Layer for Zero-Latency FAIL-FAST
      const response = await axios.post('http://localhost:8000/api/send-otp', {
        email: email.trim(),
        name: name.trim(),
        role: defaultRole,
        is_signup: false
      }, { timeout: 30000 });

      if (response.status === 429) {
        setError(response.data.detail || 'Access restricted. Please wait.');
        setOtpTimer(60);
        return;
      }

      setStep('otp');
      setOtpTimer(60);
      setSuccessMsg(`User verified as ${defaultRole}. OTP sent to email.`);
    } catch (err) {
      // FAIL-FAST logic with Retry failover
      if (err.code === 'ECONNABORTED' || err.message.toLowerCase().includes('timeout')) {
        setError('Connection Timed Out. Please Retry.');
      } else {
        setError(err.response?.data?.detail || err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAndLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:8000/api/verify-otp', {
        email,
        code: otp,
      });

      console.log("Server Response:", res.data);

      if (res.data.status === 'success') {
        // If backend returns is_setup_complete, use it. Otherwise default to 0.
        const setupDone = res.data.is_setup_complete === 1;

        login({
          email,
          role: res.data.role,
          is_onboarded: setupDone,
          onboarding_step: res.data.onboarding_step
        }, res.data.token);

        toast.success("Identity Verified");

        // REVOLUTIONARY REDIRECT: Mould the path immediately
        if (res.data.role === 'government') {
          if (!setupDone) {
            navigate('/admin-onboarding'); // Go to 10-stage wizard
          } else {
            navigate('/gov-landing'); // Go to 4-Card Dashboard
          }
        } else {
          navigate('/citizen');
        }
      }
    } catch (err) {
      console.error("FULL ERROR OBJECT:", err);
      console.error("SERVER ERROR DETAIL:", err.response?.data?.detail);
      const errorMsg = err.response?.data?.detail || "Verification failed. Check console.";
      setError(errorMsg);
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
          <h1>GOVERNMENT COMMAND</h1>
          <p>SOVEREIGN IDENTITY PROTOCOL</p>
        </div>

        {error && (
          <div className="auth-error" style={error.includes('Timed Out') ? { background: '#FF0000', color: '#fff', border: 'none', fontWeight: 'bold' } : {}}>
            {error}
            {error.includes('Timed Out') && (
              <button
                type="button"
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  background: '#10B981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => setError('')}
              >
                RETRY CONNECTION
              </button>
            )}
          </div>
        )}
        {successMsg && <div className="auth-success" style={{ background: '#ECFDF5', color: '#065F46', borderLeft: '4px solid #10B981' }}>{successMsg}</div>}

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
            <button type="submit" className="btn-auth" disabled={submitting || otpTimer > 0}>
              {submitting ? 'Authenticating...' : otpTimer > 0 ? `Wait ${otpTimer}s` : 'INITIALIZE SOVEREIGN HANDSHAKE'}
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
              {submitting ? 'Verifying Protocol...' : 'AUTHORIZE SOVEREIGN ENTRY'}
            </button>
            <div className="otp-resend">
              {otpTimer > 0 ? (
                <span>Resend available in {otpTimer}s</span>
              ) : (
                <button type="button" className="resend-link" onClick={handleRequestOtp}>Resend Code</button>
              )}
            </div>
          </form>
        )}

        <div className='auth-toggle'>
          Don't have an account?
          <button onClick={() => { navigate(signupPath) }}>Sign Up</button>
        </div>
        <div className="auth-footer">
          <Link to="/">← RETURN TO MAIN TERMINAL</Link>
        </div>
      </div>
    </div>
  );
}