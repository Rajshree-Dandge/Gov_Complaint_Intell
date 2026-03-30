import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
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
    name: '', email: '', phone: '', ward: '', uid: '', password: '', confirmPassword: '', admin_role: 'Desk_Officer'
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

  // Systems Architect: OTP Decoupling with Axios Fail-Fast
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.phone) {
      setError('Please fill Name, Email, and Phone to receive OTP');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/send-otp', { 
          email: form.email.trim(),
          name: form.name.trim(),
          role: 'government',
          is_signup: true 
        }, { timeout: 15000 });

      setOtpSent(true);
      setOtpTimer(60); 
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            setError('Connection Timed Out. Please Retry.');
        } else {
            setError(err.response?.data?.detail || err.message);
        }
    } finally {
      setSubmitting(false);
    }
  };

  
  // Systems Architect: Sub-second Verification handshake
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return setError('Enter the 6-digit code');

    setSubmitting(true);
    setError('');
    try {
      const verifyRes = await axios.post('http://localhost:8000/api/verify-otp', { 
          email: form.email.trim(), 
          code: otp.trim() 
      }, { timeout: 15000 });

      setIsVerified(true);
      setStep('details'); 
      setSuccessMsg('Email verified successfully!');
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            setError('Verification Timed Out. Please Retry.');
        } else {
            setError(err.response?.data?.detail || err.message);
        }
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
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('ward', form.ward);
      formData.append('uid', form.uid); 
      formData.append('password', form.password);
      formData.append('admin_role', form.admin_role);
      formData.append('proof', proofFile);

      const response = await axios.post('http://localhost:8000/register/government', formData, { 
          timeout: 15000,
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccessMsg('Registration submitted! Awaiting admin approval.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            setError('Submission Timed Out. High traffic detected. Please Retry.');
        } else {
            setError(err.response?.data?.detail || err.message);
        }
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
          <h1>SOVEREIGN ENLISTMENT</h1>
          <p>AUTHORIZE OFFICIAL IDENTITY</p>
        </div>

        {error && (
            <div className="auth-error" style={error.includes('Timed Out') ? {background: '#FF0000', color: '#fff', border: 'none', fontWeight: 'bold'} : {}}>
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
        {successMsg && <div className="auth-success" style={{background: '#ECFDF5', color: '#065F46', borderLeft: '4px solid #10B981'}}>{successMsg}</div>}

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
              {otpSent ? (submitting ? 'Verifying...' : 'VERIFY SOVEREIGNTY') : (submitting ? 'Sending...' : 'INITIALIZE ENLISTMENT HANDSHAKE')}
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
                <label>Administrative Hierarchy Role</label>
                <select name="admin_role" value={form.admin_role} onChange={handleChange} className="auth-select">
                    <option value="Desk_Officer">Desk Officer (Field Worker)</option>
                    <option value="Body_Admin">Body Admin (Commissioner/Sarpanch)</option>
                </select>
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
              <input type="password" name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" /></div>
              <div className="auth-field"><label>Confirm</label>
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" /></div>
            </div>


            <button type="submit" className="btn-auth" disabled={submitting}>FINALIZE SOVEREIGN IDENTITY</button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/">← RETURN TO MAIN TERMINAL</Link>
        </div>
      </div>
    </div>
  );
}