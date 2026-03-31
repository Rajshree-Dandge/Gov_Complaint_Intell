
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

export default function GovSignup() {
  const navigate = useNavigate();
  const { error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // SOVEREIGN RESUMPTION "CRACK": SKIP OTP IF ALREADY VERIFIED
  const checkResumption = async () => {
    if (!form.email.includes('@')) return;
    try {
      const res = await axios.get(`http://localhost:8001/api/onboarding/status?email=${form.email.trim()}`);
      if (res.data.skip_otp) {
        toast.success(res.data.message, {
          style: { background: '#10B981', color: '#fff', border: 'none' }
        });
        localStorage.setItem('gov_signup_email', form.email.trim());
        navigate('/admin-onboarding');
      }
    } catch (err) {
      console.error("Resumption check failed:", err);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await axios.post('http://localhost:8001/api/send-otp', {
        email: form.email.trim(), name: form.name.trim(), role: 'government', is_signup: true
      });
      
      // Initialize persistent record in backend during first handshake
      const fd = new FormData();
      fd.append('email', form.email.trim());
      fd.append('step', 1);
      fd.append('field', 'name');
      fd.append('value', form.name.trim());
      await axios.patch('http://localhost:8001/api/onboarding/update-step', fd);

      setOtpSent(true);
      setOtpTimer(60);
      setSuccessMsg('Digital Handshake Dispatched.');
    } catch (err) {
      const detail = err.response?.data?.detail || "Handshake failed.";
      
      // SOVEREIGN RESUMPTION: If email is already registered, redirect to login
      if (err.response?.status === 400 && detail.toLowerCase().includes('already registered')) {
        toast.success("Account found! Redirecting to Login to resume your setup...", {
          style: { background: '#10B981', color: '#fff', border: 'none' }
        });
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      setError(detail);
    }
    finally { setSubmitting(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(''); 
    try {
      await axios.post('http://localhost:8001/api/verify-otp', {
        email: form.email.trim(), code: otp.trim() 
      });
      localStorage.setItem('gov_signup_email', form.email.trim());
      
      toast.success("Identity Verified. Initiating Administrative Moulding...");
      setTimeout(() => navigate('/admin-onboarding'), 1000);
    } catch (err) { setError(err.response?.data?.detail || 'Invalid Handshake Code.'); } 
    finally { setSubmitting(false); }
  };

  return (
    <div className="auth-page digital-sunlight">
      <button className="auth-theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>

      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-emblem">🏛️</span>
          <h1>Hyper-Lean Signup</h1>
          <p>Sovereign Identity Protocol v2</p>
        </div>

        {error && <div className="auth-error animate-pop">{error}</div>}
        {successMsg && <div className="auth-success animate-pop">{successMsg}</div>}

        <form className="auth-form" onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp}>
          <div className="auth-field">
            <label>Legal Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required disabled={otpSent} />
          </div>
          <div className="auth-field">
            <label>Official Email</label>
            <input 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              onBlur={checkResumption}
              required 
              disabled={otpSent} 
            />
          </div>
          
          <AnimatePresence>
            {otpSent && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="auth-field">
                <label>Verification Code</label>
                <input type="text" className="otp-input-large" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" />
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="btn-auth" disabled={submitting}>
            {otpSent ? (submitting ? 'Verifying...' : 'AUTHORIZE') : (submitting ? 'Dispatching...' : 'REQUEST HANDSHAKE')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Already registered? Log In</Link>
        </div>
      </div>
    </div>
  );
}