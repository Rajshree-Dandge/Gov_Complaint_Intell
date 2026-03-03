import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CitizenProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/citizen-login" replace />;

  return children;
}
