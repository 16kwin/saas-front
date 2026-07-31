// services/AuthContext.jsx
import React, { useContext, useEffect, useState } from 'react';

const AuthContext = React.createContext(null);

const LOCKED_STORAGE_KEY = 'app_locked_state';
const LOGOUT_EVENT_KEY = 'app_logout_event';
const LOGIN_EVENT_KEY = 'app_login_event';

const emptyUserInfo = {
  id: '',
  name: '',
  role: '',
  roleDescription: '',
  firstName: '',
  middleName: '',
  lastName: '',
  imgAvatar: undefined,
};

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('app_auth_state');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLockedState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCKED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [userInfo, setUserInfo] = useState(emptyUserInfo);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOperator, setIsOperator] = useState(false);

  const setLocked = (locked) => {
    setIsLockedState(locked);
    try {
      localStorage.setItem(LOCKED_STORAGE_KEY, JSON.stringify(locked));
    } catch (e) {
      console.error('Failed to save locked state:', e);
    }
  };

  const resetAuthState = () => {
    setIsAuth(false);
    setIsAdmin(false);
    setIsOperator(false);
    setUserInfo(emptyUserInfo);
    setIsLockedState(false);
    try {
      localStorage.removeItem('app_auth_state');
      localStorage.removeItem(LOCKED_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth state:', e);
    }
  };

  const logout = async () => {
    resetAuthState();
    try {
      localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
      localStorage.removeItem('tabs_state');
    } catch (e) {}
  };

  useEffect(() => {
    localStorage.setItem('app_auth_state', JSON.stringify(isAuth));
  }, [isAuth]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === LOCKED_STORAGE_KEY) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : false;
          setIsLockedState(newValue);
        } catch {}
      }
      
      if (e.key === LOGOUT_EVENT_KEY && e.newValue) {
        window.location.href = '/login';
      }
      
      if (e.key === LOGIN_EVENT_KEY && e.newValue) {
        setIsAuth(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        setIsAuth,
        isLoading,
        userInfo,
        isAdmin,
        isOperator,
        logout,
        setLocked,
        isLocked,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};