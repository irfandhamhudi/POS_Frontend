import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../../api';

export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  _id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextProps {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; user?: AuthUser }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_KEY = 'pos_token';

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch {
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string; user?: any }> => {
    try {
      const response = await api.post('/auth/login', { username, password });

      if (response.data.success) {
        const token = response.data.token;
        localStorage.setItem(TOKEN_KEY, token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to connect to server'
      };
    }
  };

  const logout = async () => {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
