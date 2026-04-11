import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('stockease_user');
    const token = localStorage.getItem('stockease_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const { token, ...rest } = userData;
    localStorage.setItem('stockease_token', token);
    localStorage.setItem('stockease_user', JSON.stringify(rest));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(rest);
  };

  const logout = () => {
    localStorage.removeItem('stockease_token');
    localStorage.removeItem('stockease_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
