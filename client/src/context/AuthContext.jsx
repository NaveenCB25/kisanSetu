import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('profile');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, []);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data } = await authAPI.getMe();
      setUser(data.data.user);
      setProfile(data.data.profile);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('profile', JSON.stringify(data.data.profile));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    setUser(data.data.user);
    setProfile(data.data.profile);
    setToken(data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    localStorage.setItem('profile', JSON.stringify(data.data.profile));
    localStorage.setItem('token', data.data.token);
    return data.data;
  };

  const registerFarmer = async (formData) => {
    const { data } = await authAPI.registerFarmer(formData);
    setUser(data.data.user);
    setProfile(data.data.farmer);
    setToken(data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    localStorage.setItem('profile', JSON.stringify(data.data.farmer));
    localStorage.setItem('token', data.data.token);
    return data.data;
  };

  const registerCenter = async (formData) => {
    const { data } = await authAPI.registerCenter(formData);
    return data.data;
  };

  const logout = () => {
    setUser(null);
    setProfile(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user, profile, token, loading,
      login, registerFarmer, register: registerFarmer, registerCenter, logout, fetchUser,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
