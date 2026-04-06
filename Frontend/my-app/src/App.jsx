import { RouterProvider, Navigate } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider } from './context/AppContext.jsx';
import { router } from './routes.jsx';

export const GovernmentHandshake = ({ children }) => {
  const { user } = useAuth();
  
  if (user && user.role === 'government' && !user.is_onboarded) {
    return <Navigate to="/admin-onboarding" replace />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => (
  <ThemeProvider>
    <AppProvider>
      <AuthProvider>
        <ComplaintProvider>
          {/* No BrowserRouter or Routes here anymore! */}
          <RouterProvider router={router} />
        </ComplaintProvider>
      </AuthProvider>
    </AppProvider>
  </ThemeProvider>
);

export default App;