/**
 * useAuth.js
 * Custom hook untuk menangani autentikasi
 * Lokasi: src/hooks/useAuth.js
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess, logout, setValidating } from '../store/slices/authSlice';
import AuthService from '../services/AuthService';

/**
 * Hook untuk validasi token dan auto logout
 */
export const useAuth = () => {
    const dispatch = useDispatch();
    const { isLoggedIn, isValidating, error, user } = useSelector(state => state.auth);

    // Saat component mount: check token di local storage
    useEffect(() => {
        const validateToken = async () => {
            try {
                // Cek apakah user sudah login sebelumnya
                if (AuthService.isLoggedIn()) {
                    // Token masih valid, ambil data user
                    const userData = await AuthService.me();
                    dispatch(loginSuccess(userData));
                    
                    // Mulai auto-refresh token
                    AuthService.startAutoRefresh();
                    
                    console.log('[useAuth] Token valid, user logged in');
                } else {
                    console.log('[useAuth] No valid token found');
                    dispatch(logout());
                }
            } catch (err) {
                console.error('[useAuth] Token validation failed:', err.message);
                // Token invalid atau error, logout
                await AuthService.logout();
                dispatch(logout());
            } finally {
                dispatch(setValidating(false));
            }
        };

        validateToken();

        // Listen untuk session expired event
        const handleSessionExpired = () => {
            console.warn('[useAuth] Session expired event received');
            AuthService.logout();
            dispatch(logout());
        };

        window.addEventListener('auth:session-expired', handleSessionExpired);

        return () => {
            window.removeEventListener('auth:session-expired', handleSessionExpired);
            AuthService.stopAutoRefresh();
        };
    }, [dispatch]);

    // Fungsi logout
    const handleLogout = async () => {
        try {
            await AuthService.logout();
        } catch (err) {
            console.error('[useAuth] Logout error:', err.message);
        } finally {
            dispatch(logout());
            AuthService.stopAutoRefresh();
        }
    };

    return {
        isLoggedIn,
        isValidating,
        user,
        error,
        logout: handleLogout,
    };
};

export default useAuth;
