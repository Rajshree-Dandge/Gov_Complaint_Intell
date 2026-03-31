import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
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
// import NotFound from "./pages/NotFound";

import GovernmentLanding from "./pages/GovernmentLanding";
import AdminOnboarding from "./pages/AdminOnboarding";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ComplaintProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ManualPage />} />
            <Route path="/citizen-login" element={<LoginPage defaultRole="citizen" />} />
            <Route path="/login" element={<LoginPage defaultRole="government" />} />
            <Route path="/citizen-signup" element={<CitizenSignup />} />
            <Route path="/gov-signup" element={<GovSignup />} />
            <Route path="/admin-onboarding" element={<AdminOnboarding />} />

            <Route path="/citizen" element={<CitizenProtectedRoute><CitizenComplaint /></CitizenProtectedRoute>} />
            <Route path="/gov-landing" element={<ProtectedRoute allowedRole="government"><GovernmentLanding /></ProtectedRoute>} />
            <Route path="/dashboard/:category" element={<ProtectedRoute allowedRole="government"><GovernmentDashboard /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </BrowserRouter>
      </ComplaintProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
