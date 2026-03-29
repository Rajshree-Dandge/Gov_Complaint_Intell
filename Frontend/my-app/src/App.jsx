import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider } from "./context/AuthContext";
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
            <Route path="/dashboard" element={<ProtectedRoute allowedRole="government"><GovernmentLanding/></ProtectedRoute>} />
            <Route path="/dashboard/:category" element={<ProtectedRoute ><GovernmentDashboard /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ComplaintProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
