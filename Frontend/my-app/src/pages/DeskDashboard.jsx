import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Search, Activity, FileText,
    Map as MapIcon, ChevronRight, MoreVertical,
    TrendingUp, Zap, Bell, User, LayoutDashboard,
    Clock, Download
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import './DeskDashboard.css';

// --- DUMMY DATA FOR UI ---
const RECENT_COMPLAINTS = [
    { id: "GRV-8847", loc: "Zone A, Sector 5", severity: 9.2, status: "Critical", contractor: "Rajesh Contractors" },
    { id: "GRV-8846", loc: "Zone B, Sector 3", severity: 7.8, status: "High", contractor: "Sharma & Co" },
    { id: "GRV-8845", loc: "Zone C, Sector 1", severity: 6.5, status: "Medium", contractor: "Kumar Services" },
    { id: "GRV-8844", loc: "Zone A, Sector 2", severity: 8.8, status: "High", contractor: "Patel Group" },
    { id: "GRV-8843", loc: "Zone D, Sector 4", severity: 4.2, status: "Low", contractor: "Singh Enterprises" },
];

const CHART_DATA = [
    { day: 'Mon', val: 30 }, { day: 'Tue', val: 55 }, { day: 'Wed', val: 40 },
    { day: 'Thu', val: 70 }, { day: 'Fri', val: 85 }, { day: 'Sat', val: 60 }, { day: 'Sun', val: 95 }
];

export default function DeskDashboard() {
    const [activeTab, setActiveTab] = useState('active');

    return (
        <div className="desk-root bg-[#FDFDFD] min-h-screen font-sans">

            {/* --- GROWW-STYLE TOP NAV --- */}
            <nav className="desk-nav">
                <div className="nav-container">
                    <div className="nav-left">
                        <span className="logo-icon">🏛️</span>
                        <span className="logo-text">NIVARAN AI</span>
                        <div className="nav-tabs">
                            <button className="active">Active Triage</button>
                            <button>Visual Hotspots</button>
                            <button>Contractor Registry</button>
                            <button>My Performance</button>
                        </div>
                    </div>
                    <div className="nav-right">
                        <div className="icon-pills"><Bell size={18} /></div>
                        <div className="profile-pill">
                            <User size={18} />
                            <div className="profile-text">
                                <strong>Officer_Raj</strong>
                                <small>Desk 1 (Roads)</small>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="desk-content">
                <div className="content-grid">

                    {/* --- LEFT SECTION: STATS & INBOX (70%) --- */}
                    <div className="left-pane">
                        <header className="pane-header">
                            <h1>Grievance Portfolio</h1>
                            <p>Managing verified Road & Infrastructure grievances for <strong>Ward 5</strong></p>
                        </header>

                        {/* QUICK STATS CARDS */}
                        <div className="metrics-row">
                            <div className="metric-card">
                                <small>TOTAL TODAY</small>
                                <h2>12</h2>
                                <div className="trend positive"><TrendingUp size={12} /> +12%</div>
                            </div>
                            <div className="metric-card">
                                <small>URGENT (8.0+)</small>
                                <h2 className="text-rose-500">04</h2>
                                <p className="subtext">Requires immediate action</p>
                            </div>
                            <div className="metric-card">
                                <small>SLA COMPLIANCE</small>
                                <h2>94%</h2>
                                <div className="progress-bar-small"><div className="fill" style={{ width: '94%' }}></div></div>
                            </div>
                        </div>

                        {/* COMPLAINT INBOX TABLE */}
                        <div className="inbox-section">
                            <div className="inbox-header">
                                <h3>Complaint Inbox</h3>
                                <div className="filter-pills">
                                    <button className="active">Verified</button>
                                    <button>In-Progress</button>
                                    <button>Resolved</button>
                                </div>
                            </div>

                            <table className="desk-table">
                                <thead>
                                    <tr>
                                        <th>Complaint ID</th>
                                        <th>Location</th>
                                        <th>Severity</th>
                                        <th>Risk Label</th>
                                        <th>Assigned Unit</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {RECENT_COMPLAINTS.map((item) => (
                                        <tr key={item.id} className="hover-row">
                                            <td className="id-cell"><strong>{item.id}</strong></td>
                                            <td className="loc-cell"><MapIcon size={14} className="inline mr-1" /> {item.loc}</td>
                                            <td>
                                                <div className="score-meter">
                                                    <div className="meter-bg"><div className="meter-fill" style={{ width: `${item.severity * 10}%`, background: item.severity > 8 ? '#F43F5E' : '#10B981' }}></div></div>
                                                    <span>{item.severity}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-tag ${item.status.toLowerCase()}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="contractor-cell">{item.contractor}</td>
                                            <td><MoreVertical size={16} className="text-slate-300 cursor-pointer" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- RIGHT SECTION: INTELLIGENCE SIDEBAR (30%) --- */}
                    <aside className="right-sidebar">

                        {/* SYSTEM HEALTH: Pulsing Animation */}
                        <div className="sidebar-widget health-card">
                            <div className="health-pulse-ring">
                                <div className="pulse-dot"></div>
                                <Zap size={24} fill="#10B981" color="#10B981" />
                            </div>
                            <h3>System Health</h3>
                            <p className="text-emerald-500 font-bold">OPTIMAL</p>
                            <small>All AI nodes active</small>
                        </div>

                        {/* SEVERITY TREND: Fills the middle space */}
                        <div className="sidebar-widget">
                            <h4>7-Day Severity Trend</h4>
                            <div className="h-32 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={CHART_DATA}>
                                        <Area type="monotone" dataKey="val" stroke="#10B981" fill="#D1FAE5" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-400 font-medium">Avg risk index increased 12% this week.</p>
                        </div>

                        {/* ACTION CENTER: Big Buttons */}
                        <div className="sidebar-widget action-center">
                            <h4>Action Center</h4>
                            <div className="action-stack">
                                <button className="btn-action-main">
                                    <FileText size={18} /> Generate Intel Report
                                </button>
                                <button className="btn-action-outline">
                                    <MapIcon size={18} /> Visualize Red Zones
                                </button>
                            </div>
                        </div>

                        {/* AI ADVISOR: Prevents blank space at the bottom */}
                        <div className="sidebar-widget ai-advisor-card">
                            <div className="advisor-header">
                                <Activity size={14} /> <span>NIVARAN ADVISOR</span>
                            </div>
                            <p>AI suggests re-routing <strong>2 field workers</strong> to Sector 5 due to a cluster of Dangerous potholes.</p>
                        </div>

                    </aside>

                </div>
            </main>
        </div>
    );
}