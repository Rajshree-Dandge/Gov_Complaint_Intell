import { createBrowserRouter } from 'react-router-dom'; // Ensure correct import
import ManualPage from "./pages/ManualPage";
// import RoleSelection from "./pages/RoleSelection";
import LoginPage from "./pages/LoginPage";
import CitizenSignup from "./pages/CitizenSignup";
import GovSignup from "./pages/GovSignup";
import CitizenComplaint from "./pages/CitizenComplaint";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import ReportPage from "./pages/ReportPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";
import GovernmentLanding from "./pages/GovernmentLanding";
import AdminOnboarding from "./pages/AdminOnboarding";
import { Layout } from './components/Layout.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import Visualization from './pages/Visualization.jsx';
import OfficersPage from './pages/OfficersPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import EmailPage from './pages/EmailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ManualPage />,
  },
  {
    path: '/citizen-login',
    element: <LoginPage defaultRole="citizen" />,
  },
  {
    path: '/login',
    element: <LoginPage defaultRole="government" />,
  },
  {
    path: '/citizen-signup',
    element: <CitizenSignup />,
  },
  {
    path: '/gov-signup',
    element: <GovSignup />,
  },
  {
    path: '/admin-onboarding',
    element: <AdminOnboarding />,
  },
  {},
  {
    path: '/citizen',
    element: <CitizenProtectedRoute><CitizenComplaint /></CitizenProtectedRoute>,
  },
  {
    path: '/gov-landing',
    element: <ProtectedRoute allowedRole="government"><GovernmentLanding /></ProtectedRoute>,
  },
  // Your existing dashboard layout section
  {
    path: '/dashboard',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: ':category', element: <GovernmentDashboard /> }, // Merged dashboard logic
      { path: 'visualization', element: <Visualization /> },
      { path: 'officers', element: <OfficersPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'email', element: <EmailPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);