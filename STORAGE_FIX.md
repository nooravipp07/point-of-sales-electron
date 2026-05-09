# ✅ Perbaikan: Ganti electron-store dengan localStorage

## 🐛 Problem
```
Uncaught ReferenceError: __dirname is not defined
```

### Root Cause
- `electron-store` adalah Node.js module
- Tidak bisa digunakan di React renderer process (browser context)
- Mengakibatkan error `__dirname is not defined`

---

## ✅ Solution

### Changed: src/services/ApiClient.js
```javascript
// ❌ BEFORE
import Store from 'electron-store';
const store = new Store({ name: 'pos-auth' });
const token = store.get('access_token', null);

// ✅ AFTER  
const token = localStorage.getItem('access_token') || null;
```

### TokenStore Implementation
```javascript
const TokenStore = {
    save(token, expiresAt) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('expires_at', expiresAt);
    },
    get() {
        return localStorage.getItem('access_token') || null;
    },
    clear() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('expires_at');
    },
    // ... isExpired(), isNearExpiry() methods
};
```

---

## 🎯 Keuntungan localStorage

| Aspek | electron-store | localStorage |
|-------|---|---|
| **Location** | Node.js only | Browser safe ✅ |
| **Accessible** | N/A | React components |
| **Persistent** | ✅ | ✅ |
| **Encrypted** | ✅ (OS level) | ❌ |
| **Production** | Need HTTPS + secure config | Need HTTPS ✅ |

---

## 🔒 Security Notes

### Development
- localStorage tersimpan di browser storage
- Visible via DevTools → Acceptable untuk development

### Production
- Deploy dengan **HTTPS only**
- Token tidak akan dikirim via HTTP (browser blocks)
- HTTPS headers (Secure flag) melindungi token transmission
- Consider: Backend should validate token setiap request

### Additional Security
- Backend bisa set `SameSite=Strict` cookie attribute
- Implement CORS properly di backend
- Regular token rotation (refresh cycle)

---

## ✨ Perubahan File

| File | Perubahan |
|------|----------|
| `src/services/ApiClient.js` | Hapus import electron-store, ganti dengan localStorage |
| `AUTHENTICATION.md` | Update dokumentasi (localStorage instead of electron-store) |

---

## ✅ Testing Checklist

- [ ] Run `npm run dev` tanpa error `__dirname`
- [ ] Login berhasil
- [ ] Token tersimpan di localStorage (DevTools → Application → Storage → LocalStorage)
- [ ] Refresh browser → Masih login (token loaded dari localStorage)
- [ ] Logout berhasil → Token dihapus dari localStorage
- [ ] Auto-refresh token bekerja
- [ ] Token expired → Auto-redirect ke login

---

## 📝 localStorage Debug Commands

```javascript
// Di DevTools Console:

// Lihat semua token
localStorage.getItem('access_token')
localStorage.getItem('expires_at')

// Manual clear (testing)
localStorage.clear()

// Manual set (testing)
localStorage.setItem('access_token', 'test-token')
localStorage.setItem('expires_at', '2026-05-10 12:00:00')
```

---

## 🚀 Production Deployment

1. ✅ Ensure HTTPS enabled
2. ✅ Backend returns secure credentials (HTTPS only)
3. ✅ CORS headers properly configured
4. ✅ Token rotation implemented
5. ✅ Regular security audits

---

## 📚 References

- [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Web Storage Security](https://owasp.org/www-community/attacks/xss/#stored-xss-attacks)
- [Secure Cookie Attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
