import { createBrowserRouter, Navigate } from 'react-router-dom';
import ManualPage from "./pages/ManualPage";
import LoginPage from "./pages/LoginPage";
import CitizenSignup from "./pages/CitizenSignup";
import GovSignup from "./pages/GovSignup";
import CitizenComplaint from "./pages/CitizenComplaint";
import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";
import AdminOnboarding from "./pages/AdminOnboarding";
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import Visualization from './pages/Visualization.jsx';
import OfficersPage from './pages/OfficersPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import EmailPage from './pages/EmailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <ManualPage /> },
  { path: '/login', element: <LoginPage defaultRole="government" /> },
  { path: '/citizen-login', element: <LoginPage defaultRole="citizen" /> },
  { path: '/gov-signup', element: <GovSignup /> },
  { path: '/admin-onboarding', element: <AdminOnboarding /> },
  { path: '/citizen-signup', element: <CitizenSignup /> },
  
  // GOVERNMENT CONSOLE - Layout is INSIDE the router here
  {
    path: '/dashboard',
  element: <Layout />, // Removed <ProtectedRoute> wrapper
  children: [
    { index: true, element: <Dashboard /> },
    { path: 'visualization', element: <Visualization /> },,
      { path: 'officers', element: <OfficersPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'email', element: <EmailPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },

  {
    path: '/citizen',
    element: <CitizenProtectedRoute><CitizenComplaint /></CitizenProtectedRoute>,
  },
  
  // Catch-all redirect
  { path: '/gov-landing', element: <Navigate to="/dashboard" replace /> }
]);