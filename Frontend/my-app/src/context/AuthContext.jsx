import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCitizenAuthenticated, setIsCitizenAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const login = (username, password) => {
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setUser({ username, role: 'Government Official' });
      setError('');
      return true;
    }
    setError('Invalid username or password');
    return false;
  };

  const citizenLogin = (name, identityNumber, phone) => {
    if (!name.trim() || !identityNumber.trim()) {
      setError('Name and Identity Number are required');
      return false;
    }
    if (identityNumber.replace(/\s/g, '').length < 10) {
      setError('Please enter a valid identity number (minimum 10 digits)');
      return false;
    }
    setIsCitizenAuthenticated(true);
    setUser({ name, identityNumber, phone, role: 'Citizen' });
    setError('');
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsCitizenAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isCitizenAuthenticated, user, error, login, citizenLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
