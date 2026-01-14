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
      document.documentElement.style.cssText = '';
      document.body.style.cssText = 'margin: 0 !important; padding: 0 !important;';
      document.body.innerHTML = `
        <div style="
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          min-height: 100vh !important;
          width: 100vw !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f4ff 100%) !important;
          color: #334155 !important;
          padding: 24px !important;
          text-align: center !important;
          box-sizing: border-box !important;
          z-index: 999999 !important;
          margin: 0 !important;
        ">
          <div style="
            background: white !important;
            padding: 48px !important;
            border-radius: 16px !important;
            box-shadow: 0 4px 24px rgba(0,0,0,0.1) !important;
            max-width: 400px !important;
            width: 90% !important;
            text-align: center !important;
          ">
            <div style="font-size: 64px !important; margin-bottom: 16px !important; line-height: 1 !important;">🚫</div>
            <h1 style="font-size: 24px !important; font-weight: 700 !important; margin: 0 0 8px 0 !important; color: #ef4444 !important;">
              Erişim Engellendi
            </h1>
            <p style="color: #64748b !important; margin: 0 0 24px 0 !important; font-size: 14px !important; line-height: 1.5 !important;">
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
              Lütfen yöneticinizle iletişime geçin.
            </p>
            <p style="font-size: 14px !important; color: #94a3b8 !important; margin: 0 !important;">
              Giriş yapan: ${user?.name || user?.email || 'Bilinmiyor'}
            </p>
            <button onclick="window.history.back()" style="
              margin-top: 24px !important;
              padding: 12px 24px !important;
              background: #3b82f6 !important;
              color: white !important;
              border: none !important;
              border-radius: 8px !important;
              cursor: pointer !important;
              font-size: 14px !important;
              font-weight: 500 !important;
              display: inline-block !important;
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
