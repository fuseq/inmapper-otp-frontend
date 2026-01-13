const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class AuthAPI {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw { status: response.status, ...data };
      }

      return data;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw { error: 'Network error', message: 'Unable to connect to server' };
    }
  }

  async register(email, name, callbackUrl = null) {
    const body = { email, name };
    if (callbackUrl) body.callbackUrl = callbackUrl;
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async login(email, callbackUrl = null) {
    const body = { email };
    if (callbackUrl) body.callbackUrl = callbackUrl;
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async verifyOTP(email, code, callbackUrl = null) {
    const body = { email, code };
    if (callbackUrl) body.callbackUrl = callbackUrl;
    return this.request('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async resendOTP(email) {
    return this.request('/auth/resend', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async validateToken(token) {
    return this.request('/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async logout(token) {
    return this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getMe(token) {
    return this.request('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const authApi = new AuthAPI(API_URL);
export default authApi;

