/**
 * Inmapper Auth - React Hook
 * 
 * Usage:
 *   import { useInmapperAuth, InmapperAuthProvider } from 'https://inmapper-otp.netlify.app/sdk/react/useInmapperAuth.js';
 * 
 *   // In App.jsx
 *   <InmapperAuthProvider>
 *     <App />
 *   </InmapperAuthProvider>
 * 
 *   // In any component
 *   const { user, loading, isAuthenticated, login, logout } = useInmapperAuth();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DEFAULT_CONFIG = {
  apiUrl: 'https://inmapper-otp-api.isohtel.com.tr/api',
  loginUrl: 'https://inmapper-otp.netlify.app/login',
  tokenKey: 'inmapper_auth_token',
  userKey: 'inmapper_auth_user',
};

const AuthContext = createContext(null);

export function InmapperAuthProvider({ children, config = {}, protect = false }) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(null);

  const setToken = useCallback((newToken) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem(cfg.tokenKey, newToken);
    } else {
      localStorage.removeItem(cfg.tokenKey);
    }
  }, [cfg.tokenKey]);

  const login = useCallback((callbackUrl = null) => {
    const callback = callbackUrl || window.location.href;
    window.location.href = `${cfg.loginUrl}?callback=${encodeURIComponent(callback)}`;
  }, [cfg.loginUrl]);

  const logout = useCallback(async (redirect = false) => {
    if (token) {
      try {
        await fetch(`${cfg.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch (error) {
        console.error('[InmapperAuth] Logout error:', error);
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(cfg.userKey);
    if (redirect) login();
  }, [token, cfg.apiUrl, cfg.userKey, setToken, login]);

  const validateToken = useCallback(async (tokenToValidate) => {
    try {
      const response = await fetch(`${cfg.apiUrl}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToValidate }),
      });
      const data = await response.json();
      if (data.valid && data.user) {
        setUser(data.user);
        localStorage.setItem(cfg.userKey, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('[InmapperAuth] Validation error:', error);
      return null;
    }
  }, [cfg.apiUrl, cfg.userKey]);

  useEffect(() => {
    const init = async () => {
      // Check for token in URL
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        // Clean URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        const validUser = await validateToken(tokenFromUrl);
        if (!validUser && protect) {
          login();
        }
        setLoading(false);
        return;
      }

      // Check localStorage
      const storedToken = localStorage.getItem(cfg.tokenKey);
      if (storedToken) {
        setTokenState(storedToken);
        const validUser = await validateToken(storedToken);
        if (!validUser) {
          setToken(null);
          if (protect) login();
        }
      } else if (protect) {
        login();
      }
      
      setLoading(false);
    };

    init();
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    setToken,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useInmapperAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useInmapperAuth must be used within InmapperAuthProvider');
  }
  return context;
}

export default useInmapperAuth;


