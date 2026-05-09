import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        isLoggedIn: false,
        user: null,
        loading: false,
        error: null,
        isValidating: true, // untuk initial token validation
    },
    reducers: {
        // Saat login dimulai
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        // Login berhasil
        loginSuccess: (state, action) => {
            state.isLoggedIn = true;
            state.user = action.payload;
            state.loading = false;
            state.error = null;
        },
        // Login gagal
        loginFailure: (state, action) => {
            state.isLoggedIn = false;
            state.user = null;
            state.loading = false;
            state.error = action.payload;
        },
        // Logout
        logout: (state) => {
            state.isLoggedIn = false;
            state.user = null;
            state.loading = false;
            state.error = null;
        },
        // Set validasi state saat cek token awal
        setValidating: (state, action) => {
            state.isValidating = action.payload;
        },
    },
});

export const { loginStart, loginSuccess, loginFailure, logout, setValidating } = authSlice.actions;
export default authSlice.reducer;