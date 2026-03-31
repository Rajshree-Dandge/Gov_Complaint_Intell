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

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Added: Manually set a user from the Python Backend response
  const setLocalUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  useEffect(() => {
    // 1. Check for a locally saved session first (for page refreshes)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 2. Listen for Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
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