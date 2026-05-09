/**
 * AuthService.js
 * Semua operasi autentikasi untuk aplikasi POS
 * Lokasi: src/services/AuthService.js
 */

import { api, TokenStore } from './ApiClient';

const AuthService = {
    /**
     * Login kasir / admin POS
     * @param {string} name - Username/Name kasir
     * @param {string} password - Password kasir
     * @returns {Promise<{user, token}>}
     */
    async login(name, password) {
        const res = await api.post('/auth/login', { name, password }, false);

        // Simpan token ke disk (persistent antar restart app)
        TokenStore.save(res.data.token.access_token, res.data.token.expires_at);

        return {
            user:  res.data.user,
            token: res.data.token,
        };
    },

    /**
     * Logout — hapus token lokal & blacklist di server
     */
    async logout() {
            try {
                await api.post('/auth/logout');
            } catch (_) {
            // Tetap clear meski server error
            } finally {
                TokenStore.clear();
            }
    },

    /**
     * Ambil data user yang sedang login
     * @returns {Promise<User>}
     */
    async me() {
        const res = await api.get('/auth/me');
        return res.data.user;
    },

    /**
     * Cek status token (untuk UI status bar / splash screen)
     * @returns {Promise<{valid, email, expires_at, ttl_left}>}
     */
    async checkToken() {
        const res = await api.get('/auth/check-token');
        return res.data;
    },

    /**
     * Refresh token secara manual (opsional, biasanya auto)
     * @returns {Promise<token>}
     */
    async refreshToken() {
        const res = await api.post('/auth/refresh-token');
        const token = res.data.token;
        TokenStore.save(token.access_token, token.expires_at);
        return token;
    },

    /**
     * Cek apakah user sudah login (ada token & belum expired)
     */
    isLoggedIn() {
        return !!TokenStore.get() && !TokenStore.isExpired();
    },

    /**
     * Mulai auto-refresh timer (panggil sekali saat app start)
     * Akan refresh token 5 menit sebelum kadaluarsa secara otomatis
     */
    startAutoRefresh() {
        // Cek setiap 1 menit
        this._autoRefreshTimer = setInterval(async () => {
            if (!TokenStore.get()) return;
            if (TokenStore.isNearExpiry(5)) {
                try {
                    await this.refreshToken();
                    console.log('[AuthService] Token auto-refreshed');
                } catch (err) {
                    console.error('[AuthService] Auto-refresh gagal:', err.message);
                    clearInterval(this._autoRefreshTimer);
                    // Emit event agar UI menampilkan dialog session expired
                    window.dispatchEvent(new CustomEvent('auth:session-expired'));
                }
            }
        }, 60_000); // cek setiap 60 detik
    },

    stopAutoRefresh() {
        if (this._autoRefreshTimer) {
            clearInterval(this._autoRefreshTimer);
        }
    },
};

export default AuthService;