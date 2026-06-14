<div align="center">

# निvaran — Nivaran AI

### AI-powered civic grievance intelligence platform for government administrators

[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20TypeScript-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![AI](https://img.shields.io/badge/AI-Roboflow%20%7C%20HuggingFace%20%7C%20DBSCAN-FF6F00?style=for-the-badge)](https://roboflow.com/)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)]()
[![Live](https://img.shields.io/badge/Frontend-Deployed%20on%20Vercel-black?style=for-the-badge&logo=vercel)](https://nivaran-ai.vercel.app)

> **Internal intelligence tool — not a citizen-facing portal.**  
> Built for government officers, desk personnel, and administrators to manage, prioritize, and act on civic complaints at scale using AI.

</div>

---

## 🚨 The Problem

Government departments receive thousands of complaints daily. Manual processing leads to:
- Critical issues getting buried under low-priority noise
- Wrong departments receiving misdirected complaints
- Zero visibility into resolution performance or SLA compliance
- No early warning for complaint surges or public safety risks
- Citizen PII being stored insecurely in plain text

---

## 💡 The Solution

A full-stack AI-driven platform that automatically **verifies, classifies, prioritizes, clusters, and routes** civic complaints — while giving administrators a real-time role-aware dashboard instead of a messy inbox.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 📸 **AI Image Verification** | YOLOv11 via Roboflow validates that submitted images contain genuine grievances (potholes, garbage, sewage, etc.) |
| 🏷️ **NLP Classification** | `mDeBERTa-v3-base-mnli-xnli` via HuggingFace classifies complaints by department (Roads, Sanitation, Water, Electricity) |
| ⚡ **Priority Scoring** | Multi-modal scoring (image confidence × NLP urgency) produces a 1.0–10.0 severity score |
| 🗺️ **Geospatial Clustering** | DBSCAN algorithm groups nearby complaints into hotspots for the heatmap; color-coded by severity |
| 🌐 **Multilingual Support** | `deep-translator` (Google Translate) auto-translates non-English complaint descriptions |
| 🔐 **AES-256-GCM Encryption** | Citizen PII (name, phone) is encrypted at rest in the grievance database |
| 🔑 **JWT Auth + OTP Flow** | Email OTP verified before registration or complaint submission; JWT protects all dashboard routes |
| 👤 **Role-Based Dashboards** | Three distinct UIs auto-selected by role: `Admin`, `Desk_Officer`, `Contractor` |
| 📬 **Job Card Dispatch** | Desk officers assign complaints to contractors with a 24-hour SLA deadline |
| 📊 **Analytics Dashboard** | Executive summary, severity trend charts (7-day), SLA compliance rates, department KPIs |
| ☁️ **Cloud Image Storage** | Complaint images uploaded directly to Cloudinary; AI runs against the CDN URL |
| 📄 **PDF Report Export** | Admin-level exportable reports powered by `jspdf` |
| 🗂️ **Contractor Registry** | Agents/contractors managed per workspace; portfolio and efficiency tracking |
| 📧 **Automated Email Alerts** | Welcome emails, OTP dispatching via SMTP (Gmail) in async background tasks |

---

## 🏗️ System Architecture

```
[Citizen Submits Complaint]
        ↓
[Identity Check] → OTP-verified citizen session required
        ↓
[Cloudinary Upload] → Image stored in cloud, secure URL returned
        ↓
[AI Verification Layer] → Roboflow YOLOv11 scans image
        ↓ (rejected if no valid grievance detected)
[NLP Classification Engine] → mDeBERTa MNLI → Department + Severity Label
        ↓
[Priority Scoring Engine] → AI confidence × NLP label → 1.0–10.0 score
        ↓
[Geospatial Resolver] → GPS coordinates → Ward zone via Nominatim
        ↓
[Grievance DB] → AES-256-GCM encrypted PII stored in SQLite
        ↓
[Admin Dashboard] ← Role-based view (Admin / Desk Officer / Contractor)
        ↓
[DBSCAN Clustering] → Hotspot heatmap for spatial analysis
[SLA Tracker] → Deadline monitoring, auto-escalation
[Analytics Engine] → Executive summary, trend charts, KPI cards
```

---

## 🔐 Role System

| Role | Access |
|---|---|
| **Admin** | Full dashboard — executive summary, statistics, officer management, analytics, heatmap, reports |
| **Desk Officer** | Operational triage — inbox sorted by severity, job card dispatch, contractor registry, SLA tracking |
| **Contractor** | Field portal — assigned job cards, before/after photo proof uploads, personal performance audit |

Role is determined at registration (`specific_role` → `admin_role` mapping) and embedded in the JWT token.

---

## 🧠 AI & Tech Stack

### Backend
| Component | Technology |
|---|---|
| API Framework | FastAPI + Uvicorn |
| Language | Python 3.10 |
| Image AI | Roboflow (YOLOv11) — `run_ai_detection()` |
| Text AI | HuggingFace Inference API — `mDeBERTa-v3-base-mnli-xnli` |
| Clustering | scikit-learn DBSCAN (100m radius hotspots) |
| Translation | `deep-translator` (Google Translate backend) |
| Geocoding | `geopy` Nominatim |
| Image Storage | Cloudinary |
| Encryption | AES-256-GCM (`cryptography` library) |
| Auth | JWT (`python-jose`) + Email OTP |
| Databases | SQLite — `grievance.db`, `government.db`, `citizen.db` |
| Email | `smtplib` SMTP_SSL (Gmail, port 465) |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 18 + Vite (TypeScript config) |
| Routing | React Router v7 |
| UI Components | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Maps | Leaflet + React Leaflet |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| HTTP | Axios + TanStack React Query |
| PDF Export | jsPDF |
| Auth State | React Context API |
| Deployment | Vercel |

---

## 📁 Project Structure

```
NivaranAI/
├── Backend/
│   ├── takeimage.py          # Main FastAPI app — complaint submission, auth, API entry point
│   ├── detective.py          # Roboflow AI image verification engine
│   ├── priortize.py          # NLP classification & priority scoring via HuggingFace
│   ├── Clustering.py         # DBSCAN geospatial clustering for heatmap
│   ├── reglogverify.py       # Government officer registration, login, OTP, JWT issuance
│   ├── onboarding.py         # 10-stage admin onboarding pipeline
│   ├── desk_routes.py        # Desk officer APIs (inbox, job cards, stats, contractors)
│   ├── status_update.py      # Complaint status management, resolution proof upload
│   ├── verification.py       # Shared OTP + email utilities
│   ├── grievance.db          # SQLite — complaints (AES-encrypted PII)
│   ├── government.db         # SQLite — officers, workspaces, system config
│   ├── citizen.db            # SQLite — citizen accounts
│   └── requirement.txt       # Python dependencies
│
├── Frontend/
│   └── my-app/
│       ├── src/
│       │   ├── pages/         # All page components (Dashboard, DeskDashboard, CitizenComplaint, etc.)
│       │   ├── components/    # Shared UI components (Layout, ProtectedRoute, etc.)
│       │   ├── context/       # AuthContext — global auth state
│       │   ├── hooks/         # Custom React hooks
│       │   ├── routes.jsx     # Role-based routing with DashboardSwitcher
│       │   └── utils/
│       ├── package.json
│       └── vite.config.js
│
└── Testing/
    ├── evaluate.py            # API performance evaluation script
    └── testdata.csv           # Test dataset for classification & priority accuracy
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Accounts: Roboflow, HuggingFace, Cloudinary, Gmail (App Password enabled)

### Backend Setup

```bash
cd Backend

# Install dependencies
pip install -r requirement.txt

# Create a .env file with the following keys:
# ROBOFLOW_API_KEY=your_key
# ROBOFLOW_PROJECT=your_project_slug
# ROBOFLOW_VERSION=1
# HF_TOKEN=your_huggingface_token
# CLOUDINARY_CLOUD_NAME=your_cloud
# CLOUDINARY_API_KEY=your_key
# CLOUDINARY_API_SECRET=your_secret
# JWT_SECRET=your_secret_key
# ENCRYPTION_KEY=your-32-byte-key-here!!!!!!!!!!
# DATABASE_PATH=grievance.db
# GOVERNMENT_DB_PATH=government.db
# CITIZEN_DB_PATH=citizen.db

# Start the server
uvicorn takeimage:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd Frontend/my-app

# Install dependencies
npm install

# Create a .env file:
# VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🔑 Environment Variables Reference

| Variable | Used In | Description |
|---|---|---|
| `ROBOFLOW_API_KEY` | `detective.py` | Roboflow API key for YOLOv11 model access |
| `ROBOFLOW_PROJECT` | `detective.py` | Project slug on Roboflow workspace |
| `ROBOFLOW_VERSION` | `detective.py` | Model version number |
| `HF_TOKEN` | `priortize.py` | HuggingFace Inference API token |
| `CLOUDINARY_*` | `takeimage.py` | Cloud image storage credentials |
| `JWT_SECRET` | `takeimage.py`, `desk_routes.py` | Secret for signing JWT tokens |
| `ENCRYPTION_KEY` | `detective.py`, `takeimage.py` | 32-byte key for AES-256-GCM PII encryption |

---

## 📈 Roadmap

- [x] AI image verification (Roboflow YOLOv11)
- [x] NLP complaint classification (HuggingFace MNLI)
- [x] Priority scoring engine (1.0–10.0 scale)
- [x] Geospatial clustering & heatmap (DBSCAN)
- [x] Multilingual complaint translation
- [x] AES-256-GCM PII encryption
- [x] Role-based dashboard (Admin / Desk Officer / Contractor)
- [x] Job card dispatch with 24h SLA
- [x] 10-stage government officer onboarding
- [x] Contractor portfolio & performance audit
- [x] Cloud image storage (Cloudinary)
- [x] Frontend deployed on Vercel
- [ ] Live SLA breach auto-escalation emails
- [ ] Predictive surge forecasting
- [ ] Full PDF report export
- [ ] DigiLocker identity verification integration
- [ ] Real-time WebSocket notifications

---

## 🚫 Out of Scope

This system does **not** include:
- A public citizen complaint status portal (citizens submit only)
- Social media monitoring or scraping
- Multi-tenant multi-city deployments (single workspace per instance)

---

## 🙋‍♀️ Developers

Built by **Sakshi Chavan** & **Rajshree Dandge** — CS students at Terna Engineering College, exploring AI/ML applications in civic tech and governance.

---

<div align="center">
⭐ Star this repo if you find it interesting — it motivates continued development!
</div>
