import React, { useState, useRef } from 'react';
import { useComplaints } from '../context/ComplaintContext';
import { useNavigate } from 'react-router-dom';
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

const CATEGORIES = [
  'Roads',
  'Sanitation',
  'Water Supply',
  'Electrical',
  'Drainage',
  'Parks',
  'Other',
];

export default function CitizenComplaint() {
  const { addComplaint } = useComplaints();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    citizenName: '',
    phone: '',
    description: '',
    category: 'Roads',
    location: '',
    ward: '',
    language: 'en',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

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
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    addComplaint({
      ...form,
      imageUrl: imagePreview,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="citizen-page">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2>Complaint Submitted Successfully!</h2>
          <p>Your grievance has been registered. You will receive updates on the resolution.</p>
          <button className="btn-primary" onClick={() => { setSubmitted(false); setForm({ citizenName: '', phone: '', description: '', category: 'Roads', location: '', ward: '', language: 'en' }); setImageFile(null); setImagePreview(null); }}>
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="citizen-page">
      <header className="citizen-header">
        <div className="header-emblem">🏛️</div>
        <h1>Public Grievance Portal</h1>
        <p>Register your complaint — we are listening</p>
      </header>

      <form className="complaint-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input name="citizenName" value={form.citizenName} onChange={handleChange} placeholder="Enter your full name" />
              {errors.citizenName && <span className="error">{errors.citizenName}</span>}
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Complaint Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select name="language" value={form.language} onChange={handleChange}>
                {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description <span className="required">*</span></label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail (you may write in any language)"
              rows={4}
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location <span className="required">*</span></label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="Street, area, landmark" />
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
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="image-preview" />
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📷</span>
                <p>Click to upload a photo of the issue</p>
                <small>JPG, PNG — Max 5MB</small>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} hidden />
          </div>
          {errors.image && <span className="error">{errors.image}</span>}
        </div>

        <button type="submit" className="btn-primary btn-submit">Submit Complaint</button>
      </form>

      <footer className="citizen-footer">
        <a href="/dashboard">Government Login →</a>
      </footer>
    </div>
  );
}
