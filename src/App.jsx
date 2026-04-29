import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import Pos from './components/pos/Pos';
import Login from './components/auth/Login';


export default function App() {
	const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

	return isLoggedIn ? <Pos /> : <Login />;
}
