
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
    phone: '',
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

  // --- LOCATION LOGIC ---
  const requestLocation = () => {
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    };

    if ("geolocation" in navigator) {
      // 1. This triggers the native browser prompt (near the search bar)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // If allowed
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setShowModal(false); 
        },
        (error) => {
          // 2. If blocked/denied, show the custom dark modal
          console.error("Browser location blocked or failed.");
          setShowModal(true); 
        },
        geoOptions
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Trigger browser prompt as soon as the user lands on the page
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

  const validate = () => {
    const newErrors = {};
    if (!form.citizenName.trim()) newErrors.citizenName = 'Name is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.location.trim()) newErrors.location = 'Location is required';
    if (!imageFile) newErrors.image = 'Photo evidence is required';
    if (!coords.latitude) newErrors.geo = "Exact GPS location is mandatory.";
    return newErrors;
  };

  const [pipelineStep, setPipelineStep] = useState(0); // 0 to 4

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Re-show mandatory modal if they try to submit without location
      if (!coords.latitude) setShowModal(true);
      return;
    }

    setLoading(true);
    setPipelineStep(1); // START STAGE 1

    const formData = new FormData();
    formData.append("full_name", form.citizenName);
    formData.append("phone_number", form.phone);
    formData.append("language", form.language);
    formData.append("description", form.description);
    formData.append("location", form.location);
    formData.append("ward_zone", form.ward);
    formData.append("file", imageFile);
    formData.append("latitude", coords.latitude);
    formData.append("longitude", coords.longitude);

    try {
      // Simulate pipeline progression for UX
      setTimeout(() => setPipelineStep(2), 1500); // Stage 2: YOLO Scan
      setTimeout(() => setPipelineStep(3), 3000); // Stage 3: Logic Brain

      const res = await axios.post("http://192.168.0.100:8000/submit-complaint", formData);

      if (res.data.status === "success") {
        setPipelineStep(4); // Stage 4: Done
        setTimeout(() => setSubmitted(true), 1000);
      }
      else{
        alert("AI REJECTION: " + res.data.message);
        setPipelineStep(0);
      }
    } catch (err) {
      setPipelineStep(0);
      alert("Backend Offline. Start Uvicorn on Port 8000");
    } finally {
      setLoading(false);
    }
  };

  // 3. Add this visual inside your return (Above the button)
  {
    loading && (
      <div className="pipeline-container">
        <div className={`step ${pipelineStep >= 1 ? 'active' : ''}`}>📥 Storing in DB (Pending ID)</div>
        <div className={`step ${pipelineStep >= 2 ? 'active' : ''}`}>👁️ YOLOv11 Scanning Image...</div>
        <div className={`step ${pipelineStep >= 3 ? 'active' : ''}`}>🧠 Brain Categorizing Issue...</div>
        <div className={`step ${pipelineStep >= 4 ? 'active' : ''}`}>✅ Verified & Assigned to Desk</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="citizen-page">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Submitted Successfully!</h2>
          <button className="btn-primary" onClick={() => window.location.reload()}>Submit Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-page">
      {/* CUSTOM DARK DIALOG BOX (Appears only after user denies browser notification) */}
      {showModal && (
        <div className="location-modal-overlay">
          <div className="location-modal custom-dialog">
            <div className="modal-header">
               <span className="globe-icon">🌐</span>
               <span className="url-text">192.168.0.100:8000</span>
            </div>
            <p>Location sharing is mandatory for government verification and improved performance. Please enable it in your browser settings.</p>
            <div className="modal-actions">
               <button className="btn-ok" onClick={() => setShowModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      <header className="citizen-header">
        <div className="header-emblem">🏛️</div>
        <h1>Public Grievance Portal</h1>
        <p>Your location is required for verification</p>
      </header>

      {coords.latitude ? (
        <div className="geo-alert-success">📍 GPS Location Captured Successfully</div>
      ) : (
        <div className="geo-alert-error">⚠️ Waiting for Location Access...</div>
      )}

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input name="citizenName" value={form.citizenName} onChange={handleChange} placeholder="Enter your name" />
              {errors.citizenName && <span className="error">{errors.citizenName}</span>}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Complaint Details</h3>
          <div className="form-group">
            <label>Language</label>
            <select name="language" value={form.language} onChange={handleChange}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description <span className="required">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the issue..." />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location (Area Name) <span className="required">*</span></label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Street/Area" />
              {errors.location && <span className="error">{errors.location}</span>}
            </div>
            <div className="form-group">
              <label>Ward / Zone</label>
              <input name="ward" value={form.ward} onChange={handleChange} placeholder="e.g. Ward 5" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Photo Evidence <span className="required">*</span></h3>
          <div className="upload-area" onClick={() => fileRef.current.click()}>
            {imagePreview ?(
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📷</span>
                <p>Click to upload photo</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden />
          </div>
          {errors.image && <span className="error">{errors.image}</span>}
        </div>

        <button 
          type="submit" 
          className="btn-primary btn-submit" 
          disabled={loading || !coords.latitude}
          style={{ 
            opacity: !coords.latitude ? 0.5 : 1, 
            cursor: !coords.latitude ? 'not-allowed' : 'pointer',
            backgroundColor: !coords.latitude ? '#ccc' : '' 
          }}
        >
          {loading ? "Processing..." : "Submit Complaint"}
        </button>
      </form>

      <footer className="citizen-footer">
        <a href="/select-role">← Back to Role Selection</a>
      </footer>
    </div>
  );
}
