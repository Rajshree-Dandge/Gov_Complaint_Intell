import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
 const { user, isAuthenticated, loading } = useAuth();

  if (loading) return  (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem' }}>
        Loading...
      </div>
    ); // Prevent premature redirects

  // 2. If not logged in at all, send to role selection
  if (!isAuthenticated) {
    return <Navigate to="/select-role" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Logged in but wrong role? Send to their correct home
    console.error(`Access Denied: Required ${allowedRole}, but user is ${user.role}`);
    return <Navigate to={user?.role === 'government' ? "/dashboard" : "/citizen"} replace />;
  }

  return children;
}