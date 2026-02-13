import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi, register as registerApi, logout as logoutApi, getProfile } from '../services/authService';

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      getProfile()
        .then((r) => {
          const payload = r.data?.data ?? r.data;
          if (payload?.user) setUser(payload.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        });
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginApi(email, password);
      const payload = response.data?.data ?? response.data;
      const userData = payload.user;
      const tokenData = payload.token;
      
      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('token', tokenData);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerApi(name, email, password);
      const payload = response.data?.data ?? response.data;
      const userData = payload.user;
      const tokenData = payload.token;
      
      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('token', tokenData);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    logoutApi(); // This might call an API endpoint in a real implementation
    navigate('/login');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};