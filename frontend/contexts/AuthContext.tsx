import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  phone: string;
  name: string;
  role: string;
  current_event_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      const tokenData = await AsyncStorage.getItem('auth_token');
      
      if (userData) {
        setUser(JSON.parse(userData));
      }
      
      if (tokenData) {
        setToken(tokenData);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    loading,
    setUser: async (newUser: User | null) => {
      setUser(newUser);
      if (newUser) {
        await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      } else {
        await AsyncStorage.removeItem('user_data');
      }
    },
    setToken: async (newToken: string | null) => {
      setToken(newToken);
      if (newToken) {
        await AsyncStorage.setItem('auth_token', newToken);
      } else {
        await AsyncStorage.removeItem('auth_token');
      }
    },
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
