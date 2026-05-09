import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import AuthService from '../../services/AuthService';

export default function Login() {

    const dispatch = useDispatch();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        dispatch(loginStart());
        setLoading(true);

        try {
            // Panggil API login
            const result = await AuthService.login(username, password);
            
            // Simpan user ke Redux
            dispatch(loginSuccess(result.user));
            
            // Mulai auto-refresh token
            AuthService.startAutoRefresh();
        } catch (err) {
            console.error('Login error:', err);
            const errorMessage = err?.message || 'Login gagal, silakan coba lagi';
            setError(errorMessage);
            dispatch(loginFailure(errorMessage));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-10">

                    {/* Heading */}
                    <h1 className="text-lg font-semibold text-gray-900 mb-1">Welcome back</h1>
                    <p className="text-sm text-gray-400 mb-8">Sign in to Priyadis POS</p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Name/Username */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Name</label>
                            <input
                                type="text"
                                required
                                disabled={loading}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">Password</label>
                            <input
                                type="password"
                                required
                                disabled={loading}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}