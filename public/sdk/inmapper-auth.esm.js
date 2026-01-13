/**
 * Inmapper Auth SDK - ES Module Version
 * 
 * Usage:
 *   import { InmapperAuth, useInmapperAuth } from 'https://inmapper-otp.netlify.app/sdk/inmapper-auth.esm.js';
 */

const DEFAULT_CONFIG = {
  apiUrl: 'https://inmapper-otp-api.isohtel.com.tr/api',
  loginUrl: 'https://inmapper-otp.netlify.app/login',
  tokenKey: 'inmapper_auth_token',
  userKey: 'inmapper_auth_user',
  autoRedirect: true,
  onAuthRequired: null,
  onAuthSuccess: null,
  onAuthError: null,
};

export class InmapperAuth {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this._user = null;
    this._token = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return this;
    this._handleCallbackToken();
    this._loadFromStorage();
    this._initialized = true;
    return this;
  }

  async protect() {
    await this.init();
    const user = await this.getUser();
    if (!user) {
      this._redirectToLogin();
      return null;
    }
    return user;
  }

  async isAuthenticated() {
    await this.init();
    const user = await this.getUser();
    return !!user;
  }

  async getUser(forceRefresh = false) {
    await this.init();
    
    if (!this._token) return null;
    if (this._user && !forceRefresh) return this._user;

    try {
      const response = await fetch(`${this.config.apiUrl}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this._token }),
      });

      const data = await response.json();

      if (data.valid && data.user) {
        this._user = data.user;
        this._saveToStorage();
        if (this.config.onAuthSuccess) this.config.onAuthSuccess(this._user);
        return this._user;
      } else {
        this._clearAuth();
        return null;
      }
    } catch (error) {
      console.error('[InmapperAuth] Validation error:', error);
      if (this.config.onAuthError) this.config.onAuthError(error);
      return null;
    }
  }

  getToken() {
    return this._token;
  }

  setToken(token) {
    this._token = token;
    this._user = null;
    this._saveToStorage();
  }

  login(callbackUrl = null) {
    const callback = callbackUrl || window.location.href;
    window.location.href = `${this.config.loginUrl}?callback=${encodeURIComponent(callback)}`;
  }

  async logout(redirect = false) {
    if (this._token) {
      try {
        await fetch(`${this.config.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this._token }),
        });
      } catch (error) {
        console.error('[InmapperAuth] Logout error:', error);
      }
    }
    this._clearAuth();
    if (redirect) this.login();
  }

  async fetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this._token}`,
      },
    });
  }

  _handleCallbackToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      this._token = tokenFromUrl;
      this._saveToStorage();
      const cleanUrl = window.location.pathname + 
        window.location.search.replace(/[?&]token=[^&]+/, '').replace(/^&/, '?');
      window.history.replaceState({}, document.title, cleanUrl || window.location.pathname);
    }
  }

  _loadFromStorage() {
    try {
      this._token = localStorage.getItem(this.config.tokenKey);
      const userJson = localStorage.getItem(this.config.userKey);
      this._user = userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('[InmapperAuth] Storage error:', error);
    }
  }

  _saveToStorage() {
    try {
      if (this._token) localStorage.setItem(this.config.tokenKey, this._token);
      if (this._user) localStorage.setItem(this.config.userKey, JSON.stringify(this._user));
    } catch (error) {
      console.error('[InmapperAuth] Storage error:', error);
    }
  }

  _clearAuth() {
    this._token = null;
    this._user = null;
    try {
      localStorage.removeItem(this.config.tokenKey);
      localStorage.removeItem(this.config.userKey);
    } catch (error) {
      console.error('[InmapperAuth] Storage error:', error);
    }
  }

  _redirectToLogin() {
    if (this.config.onAuthRequired) {
      this.config.onAuthRequired();
      if (!this.config.autoRedirect) return;
    }
    this.login();
  }
}

// Singleton instance for simple usage
let _instance = null;

export function getAuth(config) {
  if (!_instance) {
    _instance = new InmapperAuth(config);
  }
  return _instance;
}

export default InmapperAuth;


