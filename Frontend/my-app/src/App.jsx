import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ManualPage from "./pages/ManualPage";
import RoleSelection from "./pages/RoleSelection";
import LoginPage from "./pages/LoginPage";
import CitizenSignup from "./pages/CitizenSignup";
import GovSignup from "./pages/GovSignup";
import CitizenComplaint from "./pages/CitizenComplaint";
import GovernmentLanding from "./pages/GovernmentLanding";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import ReportPage from "./pages/ReportPage";
import AdminOnboarding from "./pages/AdminOnboarding";
import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";
import NotFound from "./pages/NotFound";

/**
 * IDENTITY HANDSHAKE: THE ADMINISTRATIVE GATEKEEPER
 * Strictly routes the Government Official based on setup context.
 */
const GovernmentHandshake = () => {
    const { user, isAuthenticated } = useAuth();
    
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    // SYSTEM ARCHITECT: IDENTITY HANDSHAKE GATEWAY
    // If the administrator hasn't moulded the system yet, funnel they to the wizard.
    if (user?.admin_role === 'Admin' && user?.is_setup_complete === 0) {
        return <Navigate to="/admin-onboarding" replace />;
    }
    
    // If setup is complete (1), immediately serve the 'Governance Newspaper'
    if (user?.is_setup_complete === 1) {
        // Defaults to Roads & Infrastructure as the primary entry tier
        return <Navigate to="/dashboard/Roads & Infrastructure" replace />;
    }

    // Default Fallback: If system is not set up and user is not an admin, they must wait for the handshake.
    return (
      <div className="war-room-loader" style={{ textAlign: 'center', marginTop: '20%' }}>
        <span>Awaiting System Moulding...</span>
      </div>
    );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ComplaintProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ManualPage />} />
            <Route path="/select-role" element={<RoleSelection />} />
            <Route path="/citizen-login" element={<LoginPage defaultRole="citizen" />} />
            <Route path="/login" element={<LoginPage defaultRole="government" />} />
            <Route path="/citizen-signup" element={<CitizenSignup />} />
            <Route path="/gov-signup" element={<GovSignup />} />
            <Route path="/admin-onboarding" element={<ProtectedRoute allowedRole="government"><AdminOnboarding /></ProtectedRoute>} />
            <Route path="/citizen" element={<CitizenProtectedRoute><CitizenComplaint /></CitizenProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRole="government"><GovernmentHandshake /></ProtectedRoute>} />
            <Route path="/dashboard/:category" element={<ProtectedRoute allowedRole="government"><GovernmentDashboard /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ComplaintProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
