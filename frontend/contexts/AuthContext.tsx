import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  phone: string;
  name: string;
  role: string;
  current_event_id?: string;
}

interface ActiveEvent {
  _id: string;
  name: string;
  date: string;
  location: string;
  event_type: string;
  family_head_name?: string;
  bride_name?: string;
  groom_name?: string;
  event_person_name?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  couple_photo?: string;
  qr_code?: string;
  code?: string;
  guest_count?: number;
  guest_limit?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  activeEvent: ActiveEvent | null;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  setActiveEvent: (event: ActiveEvent | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'chadivimpulu_user';
const ACTIVE_EVENT_KEY = 'chadivimpulu_active_event';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeEvent, setActiveEventState] = useState<ActiveEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [userData, eventData] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(ACTIVE_EVENT_KEY),
      ]);

      if (userData) {
        setUser(JSON.parse(userData));
      }
      if (eventData) {
        setActiveEventState(JSON.parse(eventData));
      }
    } catch (error) {
      console.error('Error loading stored data:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([USER_STORAGE_KEY, ACTIVE_EVENT_KEY]);
      setUser(null);
      setActiveEventState(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const setActiveEvent = async (event: ActiveEvent | null) => {
    try {
      if (event) {
        await AsyncStorage.setItem(ACTIVE_EVENT_KEY, JSON.stringify(event));
        // Also update user's current_event_id
        if (user) {
          const updatedUser = { ...user, current_event_id: event._id };
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        await AsyncStorage.removeItem(ACTIVE_EVENT_KEY);
      }
      setActiveEventState(event);
    } catch (error) {
      console.error('Error saving active event:', error);
    }
  };

  const value = {
    user,
    loading,
    activeEvent,
    login,
    logout,
    setActiveEvent,
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
