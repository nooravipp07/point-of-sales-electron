# 🔐 Implementasi Autentikasi Login - Priyadis POS

Dokumentasi lengkap implementasi autentikasi dengan JWT token, auto-refresh, dan persistent storage.

---

## 📋 Fitur Utama

✅ **Login dengan API**
- Username/Password authentication
- Token disimpan persistent di localStorage browser
- Error handling untuk login gagal

✅ **Token Validation**
- Cek token saat aplikasi start
- Auto-redirect ke login jika token invalid/expired
- Validasi token via endpoint `/api/auth/check-token`

✅ **Auto-Refresh Token**
- Token auto-refresh 5 menit sebelum expired
- Cek setiap 60 detik
- Fallback logout jika refresh gagal

✅ **Logout**
- Blacklist token di server
- Hapus token dari local storage
- Redirect ke login page

✅ **Session Management**
- Persistent login antar restart aplikasi
- Auto-logout jika session expired
- Loading screen saat validasi awal

---

## 🏗️ Arsitektur

### Services
```
src/services/
├── ApiClient.js       ← HTTP client dengan token auto-refresh
└── AuthService.js     ← Business logic autentikasi
```

### Hooks
```
src/hooks/
└── useAuth.js         ← Custom hook untuk auth management
```

### Redux Store
```
src/store/slices/
└── authSlice.js       ← Auth state management
```

### Components
```
src/components/
├── auth/
│   └── Login.jsx      ← Login form dengan API call
└── pos/
    └── Pos.jsx        ← Logout button
```

---

## 🔧 Konfigurasi

### 1. Environment Variables (.env)
```
VITE_API_URL=http://localhost:8000/api
```

### 2. Dependencies
Semua dependencies sudah ter-install (tidak perlu electron-store).

---

## 📱 Flow Diagram

```
App.jsx Start
    ↓
useAuth Hook - Check Token
    ↓
Token Valid? 
    ├─ YES → Dispatch loginSuccess
    │         Start Auto-Refresh Timer
    │         Show Pos Component
    │
    └─ NO  → Dispatch logout
             Show Login Component
             ↓
          User Enter Username/Password
             ↓
          AuthService.login() Call
             ↓
          API /auth/login
             ↓
          Response (user + token)
             ↓
          TokenStore.save() [localStorage]
             ↓
          Dispatch loginSuccess
             ↓
          Show Pos Component
```

---

## 🔄 Token Lifecycle

### 1️⃣ **Login** (GET NEW TOKEN)
```javascript
// Login.jsx
const result = await AuthService.login(username, password);
// TokenStore saves: access_token + expires_at
// Redux: loginSuccess(user)
// Auto-refresh started
```

### 2️⃣ **Token Usage** (API CALLS)
```javascript
// ApiClient.js - Setiap request ke API
- Check token near expiry (5 menit sebelum expired)
  - Jika YES → Auto-refresh token
  - Jika NO  → Lanjut request
- Add Authorization header: Bearer {token}
- Send request
```

### 3️⃣ **Auto-Refresh** (60 DETIK SEKALI)
```javascript
// AuthService.js - startAutoRefresh()
Every 60 seconds:
  - Check if token in store
  - Check if token near expiry (5 menit)
    - Jika YES → Call /api/auth/refresh-token
    - Token updated in store
    - Jika FAILED → Emit session-expired event → Auto logout
```

### 4️⃣ **Logout**
```javascript
// useAuth.js - handleLogout()
- Call /api/auth/logout (blacklist token di server)
- TokenStore.clear() (hapus dari disk)
- Dispatch logout action (Redux)
- Stop auto-refresh timer
- Redirect to Login
```

---

## 📝 API Endpoints Reference

Dari `JWT-AUTH.md`:

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | ❌ | Login & dapatkan token |
| GET | `/api/auth/me` | ✅ | Ambil data user |
| GET | `/api/auth/check-token` | ✅ | Cek status token |
| POST | `/api/auth/refresh-token` | ⚠️ | Refresh token (dapat token baru) |
| POST | `/api/auth/logout` | ✅ | Logout & invalidate token |

**Legend:**
- ✅ = Perlu token valid
- ⚠️ = Perlu token (bisa expired, tapi masih dalam refresh_ttl)
- ❌ = Tidak perlu token

---

## 🛠️ Struktur File Detail

### 1. **ApiClient.js** - HTTP Client
```javascript
export { api, ApiError, TokenStore };

const BASE_URL = import.meta.env.VITE_API_URL;

// Token storage di localStorage
TokenStore.save(token, expiresAt)
TokenStore.get()
TokenStore.isExpired()
TokenStore.isNearExpiry(minutes)

// Core features
api.get(endpoint, auth)
api.post(endpoint, body, auth)
// Auto-refresh on 401 TOKEN_EXPIRED
// Auto-refresh if token near expiry
```

### 2. **AuthService.js** - Business Logic
```javascript
export default AuthService;

AuthService.login(name, password)         → user + token
AuthService.logout()                       → clear token
AuthService.me()                           → current user
AuthService.checkToken()                   → token status
AuthService.refreshToken()                 → new token
AuthService.isLoggedIn()                   → boolean
AuthService.startAutoRefresh()             → start timer
AuthService.stopAutoRefresh()              → stop timer
```

### 3. **authSlice.js** - Redux State
```javascript
state = {
  isLoggedIn: boolean,
  user: object | null,
  loading: boolean,
  error: string | null,
  isValidating: boolean,  ← initial token check
}

actions = {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setValidating,
}
```

### 4. **useAuth.js** - Custom Hook
```javascript
const { 
  isLoggedIn,
  isValidating,
  user,
  error,
  logout 
} = useAuth();

// Automatically:
// - Check token on mount
// - Listen to session-expired event
// - Start/stop auto-refresh
// - Provide logout function
```

### 5. **Login.jsx** - Login Form
```javascript
<form onSubmit={handleSubmit}>
  - Username input
  - Password input
  - Error message display
  - Loading state
</form>

handleSubmit:
  - Call AuthService.login()
  - Dispatch loginSuccess
  - Start auto-refresh
  - Handle errors
```

### 6. **App.jsx** - Root Component
```javascript
const { isValidating } = useAuth();
const isLoggedIn = useSelector(state => state.auth.isLoggedIn);

if (isValidating) → Show loading screen
if (isLoggedIn)   → Show Pos component
else              → Show Login component
```

### 7. **Pos.jsx** - Main App
```javascript
const { logout: handleLogout } = useAuth();

<SidebarItem 
  icon={LogOut}
  onClick={handleLogout}
/>

// handleLogout:
// - Call AuthService.logout()
// - Dispatch logout action
// - Auto redirect ke login (via App.jsx)
```

---

## 🔒 Security Features

1. **Token Storage**
   - Menggunakan `localStorage` (standard browser storage)
   - Token visible di browser devtools, gunakan HTTPS di production

2. **Auto-Refresh**
   - Token di-refresh sebelum expired
   - Mencegah user tiba-tiba di-logout

3. **Error Handling**
   - 401 TOKEN_EXPIRED → Auto-refresh + retry
   - Refresh failed → Auto-logout

4. **Session Validation**
   - Check token saat app start
   - Check token saat user navigate

---

## 🧪 Testing

### Test 1: Login Success
```
1. Buka aplikasi → Lihat loading screen
2. Login dengan credentials valid
3. Seharusnya redirect ke POS
4. Tutup & buka aplikasi lagi → Masih login (token di localStorage)
```

### Test 2: Invalid Token
```
1. Open DevTools → Application → LocalStorage → Edit token
2. Restart aplikasi
3. Seharusnya redirect ke Login
```

### Test 3: Token Expired
```
1. Edit expires_at di token store → Tanggal kemarin
2. Restart aplikasi
3. Seharusnya redirect ke Login
```

### Test 4: Logout
```
1. Sudah login
2. Klik logout button
3. Seharusnya redirect ke Login
4. Token dihapus dari storage
```

### Test 5: Auto-Refresh
```
1. Login (expires_in: 7200 detik)
2. Tunggu 5 menit
3. Check console → "Token auto-refreshed"
4. Token sudah update di storage
```

---

## ⚠️ Troubleshooting

### Error: "Tidak dapat terhubung ke server"
```
→ Pastikan API URL di .env benar
→ Pastikan backend sudah running
→ Pastikan CORS enabled di backend
```

### Error: "Token sudah kadaluarsa"
```
→ Check sistem clock (sync with server)
→ Restart aplikasi
→ Login ulang
```

### User logout tiba-tiba
```
→ Check browser console untuk error
→ Check auto-refresh timer di console
→ Pastikan token tidak invalid di store
```

### Token tidak auto-refresh
```
→ Check if AuthService.startAutoRefresh() di-call setelah login
→ Check browser console untuk error
→ Check token expiry time di store
```

---

## 📚 References

- [JWT-AUTH.md](JWT-AUTH.md) - API Endpoints Documentation
- [MDN localStorage docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Redux Toolkit docs](https://redux-toolkit.js.org/)
- [React Hooks](https://react.dev/reference/react)

---

## ✅ Implementation Checklist

- [x] ApiClient.js dengan auto-refresh
- [x] AuthService.js dengan business logic
- [x] authSlice.js dengan state management
- [x] useAuth.js hook untuk validasi
- [x] Login.jsx dengan API call
- [x] App.jsx dengan token check
- [x] Pos.jsx dengan logout button
- [x] .env dengan VITE_API_URL
- [x] Loading screen pada app start
- [x] Error handling & display
- [x] Auto-refresh timer

---

## 🚀 Deployment Checklist

Sebelum production:
- [ ] Test login dengan credentials real
- [ ] Test token refresh flow
- [ ] Test logout & session invalidation
- [ ] Check error messages user-friendly
- [ ] Verify token tidak exposed di logs
- [ ] Verify CORS headers di backend
- [ ] Update API_URL di .env untuk production
- [ ] Test offline scenario (network error)
