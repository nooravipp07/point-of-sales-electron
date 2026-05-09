import React from 'react';
import { useSelector } from 'react-redux';
import useAuth from './hooks/useAuth';
import Pos from './components/pos/Pos';
import Login from './components/auth/Login';

export default function App() {
	const { isValidating } = useAuth();
	const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

	// Tampilkan loading screen saat validasi token awal
	if (isValidating) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Jika sudah login, tampilkan POS, otherwise tampilkan Login
	return isLoggedIn ? <Pos /> : <Login />;
}
