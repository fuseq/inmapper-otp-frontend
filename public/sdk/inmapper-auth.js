/**
 * Inmapper Auth SDK
 * Universal authentication library for web applications
 * 
 * Usage (Vanilla JS):
 *   <script src="https://inmapper-otp.netlify.app/sdk/inmapper-auth.js"></script>
 *   <script>
 *     const auth = new InmapperAuth();
 *     auth.protect().then(user => console.log('Welcome', user.name));
 *   </script>
 * 
 * Usage (ES Module):
 *   import { InmapperAuth } from 'https://inmapper-otp.netlify.app/sdk/inmapper-auth.esm.js';
 *   const auth = new InmapperAuth();
 *   const user = await auth.protect();
 */

(function(global) {
  'use strict';

  const DEFAULT_CONFIG = {
    apiUrl: 'https://inmapper-otp-api.isohtel.com.tr/api',
    loginUrl: 'https://inmapper-otp.netlify.app/login',
    tokenKey: 'inmapper_auth_token',
    userKey: 'inmapper_auth_user',
    autoRedirect: true,
    resourceId: null, // Resource identifier for permission checking
    onAuthRequired: null,
    onAuthSuccess: null,
    onAuthError: null,
    onAccessDenied: null, // Called when user doesn't have permission
  };

  class InmapperAuth {
    constructor(config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this._user = null;
      this._token = null;
      this._initialized = false;
    }

    /**
     * Initialize and check authentication
     * Call this on page load
     */
    async init() {
      if (this._initialized) return this;
      
      // Check for token in URL (returning from login)
      this._handleCallbackToken();
      
      // Load from storage
      this._loadFromStorage();
      
      this._initialized = true;
      return this;
    }

    /**
     * Protect the current page - redirects to login if not authenticated
     * @param {Object} options - Protection options
     * @param {string} options.resourceId - Override config resourceId for this check
     * @returns {Promise<Object|null>} User object or null
     */
    async protect(options = {}) {
      await this.init();
      
      const result = await this.getUser(false, options.resourceId || this.config.resourceId);
      
      if (!result) {
        this._redirectToLogin();
        return null;
      }

      // Check permission if resourceId is set
      if (result.hasResourceAccess === false) {
        this._handleAccessDenied(result.user);
        return null;
      }
      
      return result.user || result;
    }

    /**
     * Check if user is authenticated (without redirect)
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
      await this.init();
      const user = await this.getUser();
      return !!user;
    }

    /**
     * Get current user (validates token with server)
     * @param {boolean} forceRefresh - Force server validation
     * @param {string} resourceId - Resource to check permission for
     * @returns {Promise<Object|null>} User object with permission info or null
     */
    async getUser(forceRefresh = false, resourceId = null) {
      await this.init();
      
      if (!this._token) {
        return null;
      }

      // Return cached user if not forcing refresh and no resource check needed
      if (this._user && !forceRefresh && !resourceId) {
        return this._user;
      }

      // Validate with server
      try {
        const body = { token: this._token };
        if (resourceId) {
          body.resource = resourceId;
        }

        const response = await fetch(`${this.config.apiUrl}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.valid && data.user) {
          this._user = data.user;
          this._saveToStorage();
          
          if (this.config.onAuthSuccess) {
            this.config.onAuthSuccess(this._user);
          }
          
          // Return full data if resourceId was provided (includes hasResourceAccess)
          if (resourceId) {
            return {
              user: this._user,
              hasResourceAccess: data.hasResourceAccess
            };
          }
          
          return this._user;
        } else {
          this._clearAuth();
          return null;
        }
      } catch (error) {
        console.error('[InmapperAuth] Validation error:', error);
        
        if (this.config.onAuthError) {
          this.config.onAuthError(error);
        }
        
        return null;
      }
    }

    /**
     * Get current token
     * @returns {string|null}
     */
    getToken() {
      return this._token;
    }

    /**
     * Manually set token (useful for server-side scenarios)
     * @param {string} token
     */
    setToken(token) {
      this._token = token;
      this._user = null;
      this._saveToStorage();
    }

    /**
     * Redirect to login page
     * @param {string} callbackUrl - URL to return to after login (defaults to current page)
     */
    login(callbackUrl = null) {
      const callback = callbackUrl || window.location.href;
      const loginUrl = `${this.config.loginUrl}?callback=${encodeURIComponent(callback)}`;
      window.location.href = loginUrl;
    }

    /**
     * Logout and optionally redirect to login
     * @param {boolean} redirect - Redirect to login page after logout
     */
    async logout(redirect = false) {
      // Revoke session on server
      if (this._token) {
        try {
          await fetch(`${this.config.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: this._token }),
          });
        } catch (error) {
          console.error('[InmapperAuth] Logout error:', error);
        }
      }

      this._clearAuth();

      if (redirect) {
        this.login();
      }
    }

    /**
     * Make authenticated API request
     * @param {string} url
     * @param {Object} options - fetch options
     * @returns {Promise<Response>}
     */
    async fetch(url, options = {}) {
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${this._token}`,
      };

      return fetch(url, { ...options, headers });
    }

    // Private methods

    _handleCallbackToken() {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      if (tokenFromUrl) {
        this._token = tokenFromUrl;
        this._saveToStorage();

        // Clean URL
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
        if (this._token) {
          localStorage.setItem(this.config.tokenKey, this._token);
        }
        if (this._user) {
          localStorage.setItem(this.config.userKey, JSON.stringify(this._user));
        }
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
        // Default access denied behavior - show message
        // Reset all styles and use !important to override site styles
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

    /**
     * Redirect to another protected site with token
     * @param {string} url - Target URL
     */
    redirectTo(url) {
      if (this._token) {
        const separator = url.includes('?') ? '&' : '?';
        window.location.href = `${url}${separator}token=${encodeURIComponent(this._token)}`;
      } else {
        window.location.href = url;
      }
    }

    /**
     * Check if user has access to specific resource
     * @param {string} resourceId
     * @returns {Promise<boolean>}
     */
    async hasPermission(resourceId) {
      const result = await this.getUser(true, resourceId);
      return result?.hasResourceAccess === true;
    }
  }

  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InmapperAuth };
  } else if (typeof define === 'function' && define.amd) {
    define([], function() { return { InmapperAuth }; });
  } else {
    global.InmapperAuth = InmapperAuth;
  }

})(typeof window !== 'undefined' ? window : this);


