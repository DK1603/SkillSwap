import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, onAuthChange, loginWithEmail, logout as fbLogout } from '../services/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(firebaseUser => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return loginWithEmail(email, password).then(cred => {
      setUser(cred.user);
    });
  };

  const logout = () => {
    return fbLogout().then(() => setUser(null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);