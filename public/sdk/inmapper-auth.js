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
    onAuthRequired: null,
    onAuthSuccess: null,
    onAuthError: null,
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
     * @returns {Promise<Object|null>} User object or null
     */
    async protect() {
      await this.init();
      
      const user = await this.getUser();
      
      if (!user) {
        this._redirectToLogin();
        return null;
      }
      
      return user;
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
     * @returns {Promise<Object|null>} User object or null
     */
    async getUser(forceRefresh = false) {
      await this.init();
      
      if (!this._token) {
        return null;
      }

      // Return cached user if not forcing refresh
      if (this._user && !forceRefresh) {
        return this._user;
      }

      // Validate with server
      try {
        const response = await fetch(`${this.config.apiUrl}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: this._token }),
        });

        const data = await response.json();

        if (data.valid && data.user) {
          this._user = data.user;
          this._saveToStorage();
          
          if (this.config.onAuthSuccess) {
            this.config.onAuthSuccess(this._user);
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


