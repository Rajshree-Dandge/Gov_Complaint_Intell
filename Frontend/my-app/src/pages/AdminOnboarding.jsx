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
  LayoutGrid,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminOnboarding.css';

/**
 * REVOLUTIONARY DEVELOPER: ADAPTIVE GOVERNANCE PORTAL
 * The Initialization Wizard has been refactored for "Digital Sunlight" UI.
 * It provides a smooth, animated progressive handshake with the backend.
 */
const OnboardingProgressBar = ({ progress }) => {
  return (
    <div className="progress-container">
      <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
        <div className="progress-glow"></div>
      </div>
    </div>
  );
};

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

  const stepsCount = 4;
  const progressPercent = ((step - 1) / (stepsCount - 1)) * 100;

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

      // THE INTERACTIVE HANDSHAKE: POST REQUEST WITH TOKEN
      const response = await axios.post('http://127.0.0.1:8000/api/v1/system/configure', params, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.status === 'success') {
        // REVOLUTIONARY DEVELOPER: PERSISTING CONFIGURATION STATE
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
            {['Gram Panchayat', 'Nagar Parishad', 'Municipal Corporation'].map((type) => (
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
                <ShieldCheck size={20} color="#3B82F6" />
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
                <Users size={20} color="#10B981" />
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
            {['Manual', 'Email', 'Excel/Sheet'].map((flow) => (
              <div
                key={flow}
                className={`bento-item selectable-item ${formData.legacyFlow === flow ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, legacyFlow: flow })}
              >
                <div className="icon-wrapper">
                  {flow === 'Manual' ? <Files size={24} /> : flow === 'Email' ? <Bot size={24} /> : <LayoutGrid size={24} />}
                </div>
                <h3>{flow} Path</h3>
                <p>Digitalizing existing {flow.toLowerCase()} context.</p>
                {formData.legacyFlow === flow && <CheckCircle2 className="select-check" size={20} />}
              </div>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="onboarding-stage comparison-stage">
            <div className="header-item">
              <h2>The Nivaran Transformation</h2>
              <p>Witness the impact of AI-driven governance.</p>
            </div>
            
            {/* GOVERNANCE MOULDING: AI Optimized Suggestion */}
            <div className="ai-suggestion-box">
              <div className="suggestion-header">
                <Bot size={20} />
                <span>AI Optimized Operational Suggestion</span>
              </div>
              <div className="suggestion-content">
                {formData.bodyType === 'Gram Panchayat' ? (
                  <div className="suggestion-item">
                    <h4>Mould: Flat Dispatch Model</h4>
                    <p>Since you are a {formData.bodyType}, we recommend a Direct-to-Worker dispatch to minimize bureaucratic lag. AI will skip secondary desk verification.</p>
                  </div>
                ) : (
                  <div className="suggestion-item">
                    <h4>Mould: Hierarchical Triage</h4>
                    <p>Given the scale of {formData.bodyType}, we recommend multi-stage verification. AI will prioritize for Desk Officers before field dispatch.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="comparison-grid">
              <div className="comparison-card old">
                <h3 className="card-title">Legacy System</h3>
                <div className="metric-wrap">
                  <div className="metric-val" style={{color: '#ef4444'}}><Clock size={32} /> 7 Days</div>
                  <div className="metric-label">Avg. Resolution Time</div>
                </div>
                <ul>
                  <li>Manual Verification</li>
                  <li>In-person follow ups</li>
                  <li>Paper-based updates</li>
                </ul>
              </div>
              <div className="comparison-card new">
                <h3 className="card-title">Nivaran AI Pipeline</h3>
                <div className="metric-wrap">
                  <div className="metric-val" style={{color: '#10b981'}}><Zap size={32} /> 2 Hours</div>
                  <div className="metric-label">Avg. Resolution Time</div>
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
        {/* REVOLUTIONARY PROGRESS BAR: Animated Progress Handshake */}
        <div className="progress-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progressPercent}%` }}
          >
            <div className="progress-glow"></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          {renderStage()}
        </div>

        {/* Navigation Actions */}
        <div className="onboarding-footer">
          <div className="left-actions">
            {step > 1 && (
              <button className="btn-secondary" onClick={handleBack}>
                Previous Step
              </button>
            )}
          </div>

          <div className="right-actions">
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
                {isSubmitting ? 'Synergizing AI...' : 'Activate Automation'} <Zap size={18} fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOnboarding;
