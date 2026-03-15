import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ManualPage from "./pages/ManualPage";
import RoleSelection from "./pages/RoleSelection";
import AuthPage from "./pages/AuthPage";
import CitizenComplaint from "./pages/CitizenComplaint";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import ReportPage from "./pages/ReportPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";
import NotFound from "./pages/NotFound";
import GovLanding from "./pages/GovernmentLanding";


const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ComplaintProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ManualPage />} />
            <Route path="/select-role" element={<RoleSelection />} />
            <Route path="/citizen-login" element={<CitizenLogin />} />
            <Route path="/login" element={<GovernmentLogin />} />
            <Route path="/gov-landing" element={<GovLanding />} />
            <Route path="/citizen" element={<CitizenProtectedRoute><CitizenComplaint /></CitizenProtectedRoute>} />
            <Route path="/dashboard" element={<GovLanding />} />
            <Route path="/dashboard/:category" element={<GovernmentDashboard />} />
            <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </ComplaintProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
