import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// 1. IMPORT PAGES
import ManualPage from "./pages/ManualPage";
import LoginPage from "./pages/LoginPage";
import CitizenSignup from "./pages/CitizenSignup";
import GovSignup from "./pages/GovSignup";
import CitizenComplaint from "./pages/CitizenComplaint";
import AdminOnboarding from "./pages/AdminOnboarding";
import { Layout } from './components/Layout.jsx';

// --- ROLE-SPECIFIC COMPONENTS ---
import { Dashboard } from './pages/Dashboard.jsx'; // For Admin
import DeskDashboard from './pages/DeskDashboard.jsx'; // For Desk Officer / Contractor

import Visualization from './pages/Visualization.jsx';
import OfficersPage from './pages/OfficersPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import EmailPage from './pages/EmailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";

/**
 * REVOLUTIONARY DEVELOPER: THE DASHBOARD SWITCHER
 * This component "moulds" the main dashboard based on the user's role.
 */
const DashboardSwitcher = () => {
  const { user } = useAuth();
  const role = user?.admin_role || user?.role;

  // ROADS & INFRA LOGIC: Admin sees the Strategic Dashboard, Staff see the Operational Hub
  if (role === 'Admin' || role === 'Sarpanch') {
    return <Dashboard />;
  }

  // Default for Desk Officers and Contractors
  return <DeskDashboard />;
};

/**
 * IDENTITY HANDSHAKE: THE ADMINISTRATIVE GATEKEEPER
 */
const GovernmentHandshake = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="war-room-loader"><span>Syncing Sovereign Identity...</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // RESUMPTION LOGIC: If setup is incomplete, trap them in onboarding
  if (user?.is_setup_complete === 0) {
    return <Navigate to="/admin-onboarding" replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  { path: '/', element: <ManualPage /> },
  { path: '/login', element: <LoginPage defaultRole="government" /> },
  { path: '/citizen-login', element: <LoginPage defaultRole="citizen" /> },
  { path: '/gov-signup', element: <GovSignup /> },
  { path: '/admin-onboarding', element: <AdminOnboarding /> },
  { path: '/citizen-signup', element: <CitizenSignup /> },

  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRole="government">
        <GovernmentHandshake />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          // THE "CRACK": index route now uses the Switcher
          { index: true, element: <DashboardSwitcher /> },
          { path: 'visualization', element: <Visualization /> },
          { path: 'officers', element: <OfficersPage /> },
          { path: 'statistics', element: <StatisticsPage /> },
          { path: 'email', element: <EmailPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ]
      }
    ],
  },

  {
    path: '/citizen',
    element: <CitizenProtectedRoute><CitizenComplaint /></CitizenProtectedRoute>,
  },

  { path: '/gov-landing', element: <Navigate to="/dashboard" replace /> }
]);