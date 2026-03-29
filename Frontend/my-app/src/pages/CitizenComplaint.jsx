import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CitizenComplaint.css';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ur', label: 'اردو (Urdu)' },
];

export default function CitizenComplaint() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    citizenName: '',
    email: '',
    phone: '',
    otp: '',
    description: '',
    location: '',
    ward: '',
    language: 'en',
  });

  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // --- LOCATION LOGIC ---
  const requestLocation = () => {
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          setShowModal(false);

          // Reverse Geocoding with OpenStreetMap Nominatim
          try {
            const res = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            
            if (res.data && res.data.address) {
              const addr = res.data.address;
              const street = addr.road || addr.suburb || addr.neighbourhood || addr.village || "Unknown Area";
              const ward = addr.city_district || addr.suburb || addr.postcode || "General Zone";

              setForm(prev => ({
                ...prev,
                location: street,
                ward: ward
              }));
            }
          } catch (err) {
            console.error("Reverse Geocoding failed:", err);
          }
        },
        (error) => {
          console.error("Browser location blocked or failed.");
          setShowModal(true);
        },
        geoOptions
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, image: '' });
    }
  };

  // --- OTP LOGIC ---
  const handleSendOTP = async () => {
    if (!form.email || !form.citizenName) {
      alert("Please enter your name and email first.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/send-otp", {
        email: form.email,
        name: form.citizenName,
        role: "citizen",
        is_signup: true
      }, { timeout: 30000 });
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setVerifyingOtp(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/verify-otp", {
        email: form.email,
        code: form.otp
      }, { timeout: 30000 });
      if (res.data.status === "success") {
        setOtpVerified(true);
        alert("Email verified successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Invalid OTP.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.citizenName.trim()) newErrors.citizenName = 'Name is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    if (!imageFile) newErrors.image = 'Photo evidence is required';
    if (!coords.latitude) newErrors.geo = "Exact GPS location is mandatory.";
    if (!otpVerified) newErrors.otp = "Identity verification (OTP) is mandatory.";
    return newErrors;
  };

  const [pipelineStep, setPipelineStep] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (!coords.latitude) setShowModal(true);
      return;
    }

    setLoading(true);
    setPipelineStep(1);

    const formData = new FormData();
    formData.append("full_name", form.citizenName);
    formData.append("phone_number", form.phone);
    formData.append("email", form.email);
    formData.append("language", form.language);
    formData.append("description", form.description);
    formData.append("location", form.location);
    formData.append("ward_zone", form.ward);
    formData.append("file", imageFile);
    formData.append("latitude", coords.latitude);
    formData.append("longitude", coords.longitude);

    try {
      setTimeout(() => setPipelineStep(2), 1500);
      setTimeout(() => setPipelineStep(3), 3000);

      const res = await axios.post("http://127.0.0.1:8000/submit-complaint", formData, { timeout: 30000 });

      if (res.data.status === "success") {
        setPipelineStep(4);
        setTimeout(() => setSubmitted(true), 1000);
      } else {
        alert("AI Verification Failed: Please upload a valid photo.");
        setPipelineStep(0);
      }
    } catch (err) {
      setPipelineStep(0);
      alert(err.response?.data?.detail || "Submission failed. Ensure OTP is verified.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="citizen-page">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Revolutionary Success!</h2>
          <p>Your identity is verified. AI Triage Pipeline is now analyzing the grievance.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-page">
      {showModal && (
        <div className="location-modal-overlay">
          <div className="location-modal custom-dialog">
            <div className="modal-header">
              <span className="globe-icon">🌐</span>
              <span className="url-text">Nivaran-Secure-Gate</span>
            </div>
            <p>Location sharing is mandatory for government verification and automated triage. Please enable it in browser settings.</p>
            <div className="modal-actions">
              <button className="btn-ok" onClick={() => setShowModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      <header className="citizen-header">
        <div className="header-emblem">🏛️</div>
        <h1>Public Grievance Portal</h1>
        <p>Verified Identity • Real-time Triage</p>
      </header>

      {coords.latitude ? (
        <div className="geo-alert-success">📍 GPS Identity Verified • Precision High</div>
      ) : (
        <div className="geo-alert-error">⚠️ Waiting for GPS Lock...</div>
      )}

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>1. Identity Verification</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input name="citizenName" value={form.citizenName} onChange={handleChange} placeholder="As per Govt ID" />
              {errors.citizenName && <span className="error">{errors.citizenName}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <div className="input-with-action">
                <input name="email" value={form.email} onChange={handleChange} placeholder="name@example.com" disabled={otpVerified} />
                {!otpVerified && (
                  <button type="button" className="btn-action" onClick={handleSendOTP} disabled={loading || !form.email}>
                    {otpSent ? "Resend" : "Send OTP"}
                  </button>
                )}
              </div>
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
          </div>

          {otpSent && !otpVerified && (
            <div className="form-row animate-pop">
              <div className="form-group">
                <label>Enter 6-Digit OTP</label>
                <div className="input-with-action">
                  <input name="otp" value={form.otp} onChange={handleChange} placeholder="123456" maxLength={6} />
                  <button type="button" className="btn-action verify" onClick={handleVerifyOTP} disabled={verifyingOtp || form.otp.length < 6}>
                    {verifyingOtp ? "..." : "Verify"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {otpVerified && <div className="verification-badge">✅ Email Identity Verified</div>}
        </div>

        <div className="form-section">
          <h3>2. Complaint Intelligence</h3>
          <div className="form-group">
            <label>Communication Language</label>
            <select name="language" value={form.language} onChange={handleChange}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Issue Description <span className="required">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the grievance in detail..." />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                Location (Detected) <span className="required">*</span>
                {form.location && <span className="gps-verified-badge">📍 GPS Verified</span>}
              </label>
              <input 
                name="location" 
                value={form.location} 
                onChange={handleChange} 
                placeholder="Detecting area..." 
                readOnly={!!coords.latitude}
              />
              {errors.location && <span className="error">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label>
                Ward / Admin Zone
                {form.ward && <span className="gps-verified-badge">📍 GPS Verified</span>}
              </label>
              <input 
                name="ward" 
                value={form.ward} 
                onChange={handleChange} 
                placeholder="Detecting ward..." 
                readOnly={!!coords.latitude}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>3. Visual Evidence</h3>
          <div className="upload-area" onClick={() => !otpVerified ? alert("Please verify OTP first") : fileRef.current.click()}>
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📷</span>
                <p>Click to capture or upload photo</p>
                <small>YOLOv11 Verification will be applied</small>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden disabled={!otpVerified} />
          </div>
          {errors.image && <span className="error">{errors.image}</span>}
        </div>

        {loading && pipelineStep > 0 && (
          <div className="pipeline-container">
            <div className={`step ${pipelineStep >= 1 ? 'active' : ''}`}>🛡️ Identity Layer Confirmed</div>
            <div className={`step ${pipelineStep >= 2 ? 'active' : ''}`}>👁️ YOLOv11 Scan Initialized</div>
            <div className={`step ${pipelineStep >= 3 ? 'active' : ''}`}>🧠 AI Prioritization Active</div>
            <div className={`step ${pipelineStep >= 4 ? 'active' : ''}`}>✅ Pipeline Success</div>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary btn-submit"
          disabled={loading || !coords.latitude || !otpVerified}
          style={{
            opacity: (!coords.latitude || !otpVerified) ? 0.5 : 1,
            cursor: (!coords.latitude || !otpVerified) ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "Initializing AI Pipeline..." : "Submit Grievance"}
        </button>
      </form>

      <footer className="citizen-footer">
        <a href="/select-role">← Back to Role Selection</a>
      </footer>
    </div>
  );
}