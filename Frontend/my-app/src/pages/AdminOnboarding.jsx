import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Files, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight,
  ShieldCheck,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminOnboarding.css';

const AdminOnboarding = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bodyType: '',
    deskOfficers: '',
    fieldWorkers: '',
    legacyFlow: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { title: 'Body', icon: <Building2 size={16} /> },
    { title: 'Hierarchy', icon: <Users size={16} /> },
    { title: 'Workflow', icon: <Files size={16} /> },
    { title: 'Finish', icon: <Zap size={16} /> },
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleActivate = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('scope', formData.bodyType);
      params.append('mapping', JSON.stringify({
        "desk_officers": formData.deskOfficers,
        "field_workers": formData.fieldWorkers,
        "legacy_context": formData.legacyFlow
      }));
      params.append('sla', '24'); // Default SLA

      const response = await axios.post('http://127.0.0.1:8000/api/v1/system/configure', params, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.status === 'success') {
        // Update local user state to reflect setup complete
        const updatedUser = { ...user, is_setup_complete: 1 };
        login(updatedUser, token);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Configuration failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStage = () => {
    switch (step) {
      case 1:
        return (
          <div className="onboarding-stage bento-grid">
            <div className="bento-item header-item">
              <h2>Select Administrative Body</h2>
              <p>Identify the jurisdiction scale Nivaran will manage.</p>
            </div>
            {['Gram Panchayat', 'Nagar Parishad', 'BMC / PMC'].map((type) => (
              <div 
                key={type}
                className={`bento-item selectable-item ${formData.bodyType === type ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, bodyType: type })}
              >
                <div className="icon-wrapper">
                  <Building2 size={24} />
                </div>
                <h3>{type}</h3>
                <p>Configure for {type.toLowerCase()} operations.</p>
                {formData.bodyType === type && <CheckCircle2 className="select-check" size={20} />}
              </div>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="onboarding-stage bento-grid">
            <div className="bento-item header-item">
              <h2>Define Workforce Hierarchy</h2>
              <p>Allocate resources for automated task assignment.</p>
            </div>
            <div className="bento-item input-item span-2">
              <label>Number of Desk 1 Officers</label>
              <div className="input-with-icon">
                <ShieldCheck size={20} />
                <input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 5"
                  value={formData.deskOfficers}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0);
                    setFormData({ ...formData, deskOfficers: value.toString() });
                  }}
                />
              </div>
              <p className="input-hint">Officers responsible for backend verification.</p>
            </div>
            <div className="bento-item input-item span-2">
              <label>Field Workers Available</label>
              <div className="input-with-icon">
                <Users size={20} />
                <input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 20"
                  value={formData.fieldWorkers}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0);
                    setFormData({ ...formData, fieldWorkers: value.toString() });
                  }}
                />
              </div>
              <p className="input-hint">Personnel handling on-ground resolutions.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="onboarding-stage bento-grid">
            <div className="bento-item header-item">
              <h2>Legacy Workflow Mapping</h2>
              <p>How are complaints handled today?</p>
            </div>
            <div 
              className={`bento-item selectable-item ${formData.legacyFlow === 'Manual' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, legacyFlow: 'Manual' })}
            >
              <div className="icon-wrapper secondary">
                <Files size={24} />
              </div>
              <h3>Manual Paper Flow</h3>
              <p>Physical registers and hand-written memos.</p>
            </div>
            <div 
              className={`bento-item selectable-item ${formData.legacyFlow === 'Email' ? 'selected' : ''}`}
              onClick={() => setFormData({ ...formData, legacyFlow: 'Email' })}
            >
              <div className="icon-wrapper secondary">
                <LayoutGrid size={24} />
              </div>
              <h3>Basic Email/Excel</h3>
              <p>Digital receipts but manual categorization.</p>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="onboarding-stage comparison-stage">
            <div className="comparison-header">
              <h2>The Nivaran Transformation</h2>
              <p>Witness the impact of AI-driven governance.</p>
            </div>
            <div className="comparison-grid">
              <div className="comparison-card old">
                <div className="badge">LEGACY</div>
                <h3>Manual Workflow</h3>
                <div className="metric">
                  <Clock size={32} />
                  <span>7 Days</span>
                </div>
                <ul>
                  <li>Manual Verification</li>
                  <li>In-person follow ups</li>
                  <li>Paper-based updates</li>
                </ul>
              </div>
              <div className="comparison-card new">
                <div className="badge highlight">NIVARAN AI</div>
                <h3>Automated Pipeline</h3>
                <div className="metric">
                  <Zap size={32} />
                  <span>2 Hours</span>
                </div>
                <ul>
                  <li>YOLOv11 Object Detection</li>
                  <li>DBSCAN Geospatial Triage</li>
                  <li>Real-time Progress Proofs</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-onboarding-page">
      <div className="onboarding-container">
        {/* Progress Stepper */}
        <div className="stepper">
          {steps.map((s, i) => (
            <div key={i} className={`step-item ${step >= i + 1 ? 'active' : ''} ${step > i + 1 ? 'completed' : ''}`}>
              <div className="step-icon">
                {step > i + 1 ? <CheckCircle2 size={16} /> : s.icon}
              </div>
              <span>{s.title}</span>
              {i < steps.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="content-area">
          {renderStage()}
        </div>

        {/* Navigation Actions */}
        <div className="onboarding-footer">
          {step > 1 && step < 4 && (
            <button className="btn-secondary" onClick={handleBack}>
              Back
            </button>
          )}
          
          {step < 4 ? (
            <button 
              className="btn-primary" 
              onClick={handleNext}
              disabled={(step === 1 && !formData.bodyType) || (step === 2 && (!formData.deskOfficers || !formData.fieldWorkers)) || (step === 3 && !formData.legacyFlow)}
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn-activate" onClick={handleActivate} disabled={isSubmitting}>
              {isSubmitting ? 'Activating...' : 'Activate Automation'} <Zap size={18} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOnboarding;
