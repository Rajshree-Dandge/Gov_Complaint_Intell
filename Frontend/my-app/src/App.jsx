import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import CitizenComplaint from "./pages/CitizenComplaint";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import GovernmentLogin from "./pages/GovernmentLogin";
import ReportPage from "./pages/ReportPage";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ComplaintProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CitizenComplaint />} />
            <Route path="/login" element={<GovernmentLogin />} />
            <Route path="/dashboard" element={<ProtectedRoute><GovernmentDashboard /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ComplaintProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
