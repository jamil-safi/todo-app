// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me/')
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const data = await api.post('/auth/login/', { username, password });
    setUser(data.user);
  }

  async function signup(payload) {
    const data = await api.post('/auth/signup/', payload);
    return data;
  }

  async function logout() {
    await api.post('/auth/logout/', {});
    setUser(null);
  }

  const value = {
    user,
    setUser, // ✅ Added this
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}