import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../lib/Firebase';
import { validateUID } from '../utils/uidValidation';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Added: Manually set a user from the Python Backend response
  const setLocalUser = (userData, token = null) => {
    setUser((prev) => {
      const mergedUser = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(mergedUser));
      return mergedUser;
    });
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  // Alias: 'login' is the same as setLocalUser — called from LoginPage after OTP verify
  const login = setLocalUser;

  const fetchProfile = async () => {
    // 1. Ensure we use the exact key saved during login (likely 'token')
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn("📡 No token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/user/profile", {
        headers: {
          // 2. CRITICAL: Add the Axios header exactly as requested
          Authorization: "Bearer " + token
        }
      });

      console.log("✅ Profile Re-hydrated:", res.data);
      setUser(res.data);
    } catch (err) {
      // 3. If unauthorized, wipe the dead token
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      console.error("❌ Profile Handshake Failed:", err.response?.data?.detail);
    } finally {
      setLoading(false);
    }
  };
  
  // SOVEREIGN RE-HYDRATION: Trigger on page reload
  useEffect(() => {
    fetchProfile();
  }, []);

  const signUpWithEmail = async (email, password, name, role = 'citizen', uidNumber) => {
    setError('');
    if (uidNumber && !validateUID(uidNumber)) {
      const msg = "Invalid 12-digit UID. Please check your Aadhaar number.";
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      return { success: true };
    } catch (err) {
      let friendlyError = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendlyError = "This email is already registered.";
      }
      setError(friendlyError);
      return { success: false, error: friendlyError };
    }
  };

  const signInWithEmail = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    signOut(auth);
    setUser(null);
  };

  const value = {
    user,
    setLocalUser,
    login,       // Alias exposed for LoginPage.jsx
    loading,
    error,
    setError,
    signUpWithEmail,
    signInWithEmail,
    logout,
    isAuthenticated: !!user,
    isGovernment: user?.role === 'government'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);