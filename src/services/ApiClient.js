/**
 * ApiClient.js
 * Service utama untuk komunikasi dengan Laravel JWT API
 * Lokasi: src/services/ApiClient.js
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Token Storage (localStorage) ─────────────────────────────────────────

const TokenStore = {
    save(token, expiresAt) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('expires_at', expiresAt);
    },
    get() {
        return localStorage.getItem('access_token') || null;
    },
    getExpiresAt() {
        return localStorage.getItem('expires_at') || null;
    },
    clear() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('expires_at');
    },
    isExpired() {
        const expiresAt = this.getExpiresAt();
        if (!expiresAt) return true;
        return new Date(expiresAt) <= new Date();
    },
    isNearExpiry(thresholdMinutes = 5) {
        const expiresAt = this.getExpiresAt();
        if (!expiresAt) return true;
        const diff = new Date(expiresAt) - new Date();
        return diff <= thresholdMinutes * 60 * 1000;
    },
};

// ─── Core HTTP Client ───────────────────────────────────────────────────────

class ApiClient {
  constructor() {
    this._refreshing = null; // mencegah multiple refresh sekaligus
  }

  /**
   * Buat HTTP request ke API Laravel
   */
  async request(method, endpoint, body = null, requireAuth = true) {
    // Auto-refresh token jika mendekati expire
    if (requireAuth && TokenStore.isNearExpiry()) {
      await this._doRefresh();
    }

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (requireAuth) {
      const token = TokenStore.get();
      if (!token) throw new ApiError('Sesi berakhir, silakan login kembali', 401, 'TOKEN_ABSENT');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(`${BASE_URL}${endpoint}`, options);
    } catch (err) {
      throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet.', 0, 'NETWORK_ERROR');
    }

    const data = await response.json();

    // Handle token expired → coba refresh sekali lagi
    if (response.status === 401 && data?.code === 'TOKEN_EXPIRED' && requireAuth) {
      await this._doRefresh();
      return this.request(method, endpoint, body, requireAuth); // retry sekali
    }

    if (!response.ok) {
      throw new ApiError(
        data?.message || 'Terjadi kesalahan pada server',
        response.status,
        data?.code || 'SERVER_ERROR',
        data?.errors || null,
      );
    }

    return data;
  }

  /**
   * Refresh token — singleton promise agar tidak race condition
   */
  async _doRefresh() {
    if (this._refreshing) return this._refreshing;

    this._refreshing = (async () => {
      try {
        const token = TokenStore.get();
        if (!token) throw new ApiError('Tidak ada token', 401, 'TOKEN_ABSENT');

        const res = await fetch(`${BASE_URL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          TokenStore.clear();
          throw new ApiError('Sesi berakhir, silakan login kembali', 401, 'REFRESH_FAILED');
        }

        TokenStore.save(data.data.token.access_token, data.data.token.expires_at);
      } finally {
        this._refreshing = null;
      }
    })();

    return this._refreshing;
  }

  // ── Shorthand methods ──
  get(endpoint, auth = true)           { return this.request('GET', endpoint, null, auth); }
  post(endpoint, body, auth = true)    { return this.request('POST', endpoint, body, auth); }
  put(endpoint, body, auth = true)     { return this.request('PUT', endpoint, body, auth); }
  delete(endpoint, auth = true)        { return this.request('DELETE', endpoint, null, auth); }
}

// ─── Custom Error ───────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(message, status = 0, code = 'UNKNOWN', errors = null) {
    super(message);
    this.name       = 'ApiError';
    this.status     = status;
    this.code       = code;
    this.errors     = errors;
  }
}

// ─── Singleton export ───────────────────────────────────────────────────────

const api = new ApiClient();

export { api, ApiError, TokenStore };