
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './AdminOnboarding.css';

export default function AdminOnboarding() {
  const navigate = useNavigate();
  const { user, error, setError } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [resolvedName, setResolvedName] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '', 
    email: user?.email || localStorage.getItem('gov_signup_email') || '', 
    phone: '', uid: '', password: '', 
    location: '', adminBody: '', specificRole: '', workspaceCode: '' 
  });

  const BODY_DATA = {
    'Gram Panchayat': { roles: ['Sarpanch', 'Gram Sevak', 'Gram Rozgar Sahayak'], leads: ['Sarpanch'] },
    'Municipal Corporation (BMC)': { roles: ['Assistant Commissioner', 'Junior Engineer', 'Zonal Agency'], leads: ['Assistant Commissioner'] },
    'Municipality': { roles: ['Chief Officer', 'Sanitary Inspector', 'Dept Contractor'], leads: ['Chief Officer'] }
  };

  const isLeadRole = (role) => {
    if (!form.adminBody) return false;
    return BODY_DATA[form.adminBody].leads.includes(role);
  };

  // --- SOVEREIGN RESUMPTION PROTOCOL ---
  useEffect(() => {
    const fetchStatus = async () => {
      const email = form.email;
      if (!email) return;
      try {
        const res = await axios.get(`http://localhost:8000/api/onboarding/status?email=${email}`);
        if (res.data.step > 1) {
          setForm(prev => ({
            ...prev,
            adminBody: res.data.admin_body || '',
            specificRole: res.data.specific_role || '',
            location: res.data.location || '',
            workspaceCode: res.data.workspace_code || ''
          }));
          if (res.data.location) setResolvedName(res.data.location);
          setStep(res.data.step);
          toast.success("Resuming your Nivaran setup from Stage " + res.data.step);
        }
      } catch (err) { console.error("Onboarding fetch failed", err); }
    };
    fetchStatus();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const syncStep = async (nextStep, field = null, value = null) => {
    try {
      const fd = new FormData();
      fd.append('email', form.email);
      fd.append('step', nextStep);
      if (field) {
        fd.append('field', field);
        fd.append('value', value);
      }
      await axios.patch('http://localhost:8000/api/onboarding/update-step', fd);
      toast.success(`Stage ${nextStep} Synchronized`, { style: { background: '#10B981', color: '#fff', border: 'none' } });
      setStep(nextStep);
    } catch (err) {
      console.error("Sync failed:", err);
      setStep(nextStep);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation Unsupported.");
    setSubmitting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const addr = res.data.address;
          const areaName = addr.city_district || addr.suburb || addr.road || addr.village || "Sovereign Zone";
          setResolvedName(areaName);
          setForm(prev => ({ ...prev, location: areaName }));
          await syncStep(5, 'location', areaName);
        } catch (err) {
          const coords = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setForm(prev => ({ ...prev, location: coords }));
          await syncStep(5, 'location', coords);
        } finally { setSubmitting(false); }
      },
      () => { setError("Satellite Lockdown Denied."); setSubmitting(false); }
    );
  };

  const handleVerifyWorkspace = async () => {
    if (isLeadRole(form.specificRole)) {
      await syncStep(9, 'workspace_code', form.workspaceCode);
      return;
    }
    setIsValidatingCode(true);
    try {
      await axios.get(`http://localhost:8000/api/onboarding/check-code?code=${form.workspaceCode}&location=${form.location}`);
      await syncStep(9, 'workspace_code', form.workspaceCode);
    } catch (err) { setError(err.response?.data?.detail || "Invalid Key."); }
    finally { setIsValidatingCode(false); }
  };

  const handleActivate = async () => {
    setSubmitting(true);
    setError('');
    try {
      // FULL-STACK SYNC: Gather Auth identity + all 9 onboarding stage data
      const officerEmail = form.email || user?.email || localStorage.getItem('gov_signup_email') || '';
      const officerName = form.name || user?.name || '';

      const fd = new FormData();
      fd.append('full_name', officerName);
      fd.append('email', officerEmail);
      fd.append('phone', form.phone || '');
      fd.append('uid', form.uid || '');
      fd.append('password', form.password || '');
      fd.append('scope', form.adminBody || 'General');
      fd.append('desks', 5);
      fd.append('workers', 20);
      fd.append('sla', 24);

      await axios.post('http://localhost:8000/api/v1/system/configure', fd);
      toast.success("✅ Sovereign Initialization Complete. Identity Anchored.");
      localStorage.removeItem('gov_signup_email');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      // CRASH FIX: Always coerce error to a string — never let a plain object reach React children
      const raw = err.response?.data?.detail;
      const msg = Array.isArray(raw)
        ? raw[0]?.msg || JSON.stringify(raw[0])
        : typeof raw === 'string'
          ? raw
          : err.message || "Setup Error — please retry.";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { n: 1, title: 'Mobile Sync' },
    { n: 2, title: 'Sovereign ID' },
    { n: 3, title: 'Digital Signature' },
    { n: 4, title: 'Satellite Lock' },
    { n: 5, title: 'Resolution' },
    { n: 6, title: 'Body Selection' },
    { n: 7, title: 'Mandate' },
    { n: 8, title: 'Workspace' },
    { n: 9, title: 'Evidence' },
    { n: 10, title: 'Finalize' }
  ];

  const slideVar = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  return (
    <div className="auth-page digital-sunlight">
      <button className="auth-theme-toggle" onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
           <span className="auth-emblem">🏛️</span>
           <h1>Administrative Setup</h1>
           <div className="stepper-wrap">
             {steps.map(s => <div key={s.n} className={`step-dot ${step >= s.n ? 'active' : ''}`} />)}
           </div>
           <p className="step-label">Stage {step}: {steps[step-1]?.title}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="stage-content" style={{ minHeight: '320px' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key={1} {...slideVar}>
                 <div className="auth-field"><label>Mobile Synchronization</label>
                 <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" /></div>
                 <button onClick={() => syncStep(2, 'phone', form.phone)} className="btn-auth">SYNCHRONIZE MOBILE</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key={2} {...slideVar}>
                <div className="auth-field"><label>Sovereign Identity (12-digit UID)</label>
                <input type="text" name="uid" value={form.uid} onChange={handleChange} placeholder="0000 0000 0000" /></div>
                <button onClick={() => syncStep(3, 'uid_number', form.uid)} className="btn-auth">VERIFY ID</button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key={3} {...slideVar}>
                <div className="auth-field"><label>Establish Digital Signature (Password)</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" /></div>
                <button onClick={() => syncStep(4, 'password_hash', form.password)} className="btn-auth">LOCK SIGNATURE</button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key={4} {...slideVar} className="text-center">
                 <span className="big-icon">🛰️</span>
                 <h3>Satellite Lockdown</h3>
                 <p>Lock your physical office coordinates to your identity.</p>
                 <button onClick={handleGetLocation} className="btn-auth bg-emerald" disabled={submitting}>
                   {submitting ? 'Locking...' : 'ACTIVATE POSITION LOCK'}
                 </button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key={5} {...slideVar}>
                <div className="pulsing-badge-sovereign">📍 Verified Area: {resolvedName}</div>
                <div className="auth-field" style={{marginTop: '20px'}}>
                  <label>Service Jurisdiction</label>
                  <input type="text" value={form.location} readOnly className="input-locked" />
                </div>
                <button onClick={() => syncStep(6)} className="btn-auth">CONFIRM JURISDICTION</button>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div key={6} {...slideVar}>
                <label className="field-label">Administrative Body</label>
                <div className="gov-post-grid">
                  {Object.keys(BODY_DATA).map(b => (
                    <button key={b} className={`post-btn ${form.adminBody === b ? 'active' : ''}`}
                      onClick={() => { setForm({...form, adminBody: b, specificRole: ''}); syncStep(7, 'admin_body', b); }}>{b}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div key={7} {...slideVar}>
                <label className="field-label">Official Mandate (Role)</label>
                <div className="gov-post-grid">
                  {BODY_DATA[form.adminBody].roles.map(r => (
                    <button key={r} className={`post-btn ${form.specificRole === r ? 'active' : ''}`}
                      onClick={() => { setForm({...form, specificRole: r}); syncStep(8, 'specific_role', r); }}>{r}</button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 8 && (
              <motion.div key={8} {...slideVar}>
                 <h3>Workspace Handshake</h3>
                 <p className="text-muted">{isLeadRole(form.specificRole) ? "Create a Security Key for your staff." : "Enter Key from your Admin."}</p>
                 <input type="text" name="workspaceCode" value={form.workspaceCode} onChange={handleChange} 
                        placeholder="SECURITY KEY" className="text-center" style={{letterSpacing: '4px', fontWeight: 900}} />
                 <button onClick={handleVerifyWorkspace} className="btn-auth" disabled={isValidatingCode}>
                   {isValidatingCode ? 'Validating...' : 'SYNC WORKSPACE'}
                 </button>
              </motion.div>
            )}

            {step === 9 && (
              <motion.div key={9} {...slideVar}>
                <label>Appointment Documentary Proof <span style={{color: '#6B7280', fontWeight: 400, fontSize: '0.8rem'}}>(Optional — can be submitted later)</span></label>
                <div 
                  className="upload-box-sovereign" 
                  onClick={() => fileRef.current.click()}
                  style={{ cursor: 'pointer', borderStyle: proofFile ? 'solid' : 'dashed' }}
                >
                  {proofFile 
                    ? <span style={{color: '#10B981', fontWeight: 600}}>✅ {proofFile.name}</span>
                    : <span>📄 Click here to Select Document (PDF/JPG)</span>
                  }
                  <input type="file" ref={fileRef} hidden onChange={(e) => setProofFile(e.target.files[0])} />
                </div>
                <button onClick={() => syncStep(10)} className="btn-auth">PROCEED TO FINALIZE</button>
              </motion.div>
            )}

            {step === 10 && (
              <motion.div key={10} {...slideVar}>
                <h3>Identity Finalization</h3>
                <p style={{color: '#6B7280', marginBottom: '1.5rem'}}>All stages complete. Activate your Sovereign account.</p>
                <button 
                  onClick={handleActivate} 
                  className="btn-auth" 
                  disabled={submitting}
                  style={submitting ? { background: '#6EE7B7', animation: 'pulse 1.5s infinite' } : {}}
                >
                  {submitting ? '⚓ Anchoring Administrative Data...' : 'INITIALIZE SOVEREIGN ACCOUNT'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="auth-footer">
           <Link to="/gov-signup">← Review Core Identity</Link>
        </div>
      </div>
    </div>
  );
}
