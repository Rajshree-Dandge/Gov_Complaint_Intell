import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CitizenProtectedRoute({ children }) {
  const { isCitizenAuthenticated } = useAuth();

  if (!isCitizenAuthenticated) {
    return <Navigate to="/citizen-login" replace />;
  }

  return children;
}
