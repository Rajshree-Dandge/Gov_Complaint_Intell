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
import { Dashboard } from './pages/Dashboard.jsx';
import Visualization from './pages/Visualization.jsx';
import OfficersPage from './pages/OfficersPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import EmailPage from './pages/EmailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

// 2. PROTECTED ROUTE WRAPPERS
import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";

/**
 * REVOLUTIONARY DEVELOPER: THE ADMINISTRATIVE HANDSHAKE
 * This component acts as the 'State-Aware Gatekeeper'.
 * It moulds the path based on whether the Admin has completed the setup.
 */
const GovernmentHandshake = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="war-room-loader"><span>Syncing Sovereign Identity...</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // --- ADMINISTRATIVE MOULDING LOGIC ---
  // If the officer is an Admin but hasn't configured the body (Gram/BMC/City)
  if (user?.admin_role === 'Admin' && user?.is_setup_complete === 0) {
    return <Navigate to="/admin-onboarding" replace />;
  }

  // If setup is complete, allow them to enter the Dashboard Layout
  return <Outlet />;
};

// 3. THE MASTER ROUTER DEFINITION
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
        element: <Layout />, // Layout wraps all sub-pages
        children: [
          { index: true, element: <Dashboard /> },
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

  // Clean redirect from old landing path to the new Handshake Hub
  { path: '/gov-landing', element: <Navigate to="/dashboard" replace /> }
]);