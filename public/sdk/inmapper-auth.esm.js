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
  resourceId: null,
  onAuthRequired: null,
  onAuthSuccess: null,
  onAuthError: null,
  onAccessDenied: null,
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

  async protect(options = {}) {
    await this.init();
    const result = await this.getUser(false, options.resourceId || this.config.resourceId);
    
    if (!result) {
      this._redirectToLogin();
      return null;
    }

    if (result.hasResourceAccess === false) {
      this._handleAccessDenied(result.user);
      return null;
    }
    
    return result.user || result;
  }

  async isAuthenticated() {
    await this.init();
    const user = await this.getUser();
    return !!user;
  }

  async getUser(forceRefresh = false, resourceId = null) {
    await this.init();
    
    if (!this._token) return null;
    if (this._user && !forceRefresh && !resourceId) return this._user;

    try {
      const body = { token: this._token };
      if (resourceId) body.resource = resourceId;

      const response = await fetch(`${this.config.apiUrl}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.valid && data.user) {
        this._user = data.user;
        this._saveToStorage();
        if (this.config.onAuthSuccess) this.config.onAuthSuccess(this._user);
        
        if (resourceId) {
          return { user: this._user, hasResourceAccess: data.hasResourceAccess };
        }
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

  redirectTo(url) {
    if (this._token) {
      const separator = url.includes('?') ? '&' : '?';
      window.location.href = `${url}${separator}token=${encodeURIComponent(this._token)}`;
    } else {
      window.location.href = url;
    }
  }

  async hasPermission(resourceId) {
    const result = await this.getUser(true, resourceId);
    return result?.hasResourceAccess === true;
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

  _handleAccessDenied(user) {
    if (this.config.onAccessDenied) {
      this.config.onAccessDenied(user);
    } else {
      document.body.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background: #f8fafc;
          color: #334155;
          padding: 24px;
          text-align: center;
        ">
          <div style="
            background: white;
            padding: 48px;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1);
            max-width: 400px;
          ">
            <div style="font-size: 64px; margin-bottom: 16px;">🚫</div>
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px; color: #ef4444;">
              Erişim Engellendi
            </h1>
            <p style="color: #64748b; margin-bottom: 24px;">
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
              Lütfen yöneticinizle iletişime geçin.
            </p>
            <p style="font-size: 14px; color: #94a3b8;">
              Giriş yapan: ${user?.name || user?.email || 'Bilinmiyor'}
            </p>
            <button onclick="window.history.back()" style="
              margin-top: 24px;
              padding: 12px 24px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">
              Geri Dön
            </button>
          </div>
        </div>
      `;
    }
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
