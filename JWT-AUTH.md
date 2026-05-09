# JWT Authentication API

| Method | Endpoint                   | Auth  | Deskripsi                        |
|--------|----------------------------|-------|----------------------------------|
| POST   | `/api/auth/login`          | ❌    | Login & dapatkan token           |
| POST   | `/api/auth/logout`         | ✅    | Logout & invalidate token        |
| GET    | `/api/auth/me`             | ✅    | Ambil data user yang login       |
| GET    | `/api/auth/check-token`    | ✅    | Cek status & info token          |
| POST   | `/api/auth/refresh-token`  | ⚠️    | Refresh token (dapat token baru) |

> ✅ = Butuh token valid di header  
> ⚠️ = Butuh token (bisa yang expired, selama masih dalam refresh_ttl)

---

## 📡 Contoh Request & Response

### POST /api/auth/login
**Request:**
```json
{
    "name": "budi",
    "password": "rahasia123"
}
```
**Response 200:**
```json
{
    "status": true,
    "message": "Login berhasil",
    "data": {
        "user": {
            "id": 3,
            "name": "kasir1",
            "email": "kasir1postgres@gmail.com",
            "email_verified_at": null,
            "group_id": 10,
            "created_at": "2025-08-22T20:06:12.000000Z",
            "updated_at": "2025-08-23T08:19:37.000000Z",
            "is_active": 1,
            "branch_id": 5
        },
        "token": {
            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvYXBpL2F1dGgvbG9naW4iLCJpYXQiOjE3NzgzMTcyMDYsImV4cCI6MTc3ODMyNDQwNiwibmJmIjoxNzc4MzE3MjA2LCJqdGkiOiIzdXBsT3UzVnV0ZkJWU2FJIiwic3ViIjoiMyIsInBydiI6IjIzYmQ1Yzg5NDlmNjAwYWRiMzllNzAxYzQwMDg3MmRiN2E1OTc2ZjcifQ.zWyTBAeeEwYRGs6bIbAhTFqf86asL3IeyCKdMFX2bh4",
            "token_type": "Bearer",
            "expires_in": 7200,
            "expires_at": "2026-05-09 18:00:06"
        }
    }
}
```

---

### GET /api/auth/check-token
**Header:** `Authorization: Bearer {token}`

**Response 200 (valid):**
```json
{
    "status": true,
    "message": "Token valid",
    "data": {
        "valid": true,
        "user_id": 3,
        "username": null,
        "issued_at": "2026-05-09 16:00:06",
        "expires_at": "2026-05-09 18:00:06",
        "ttl_left": "5364 detik"
    }
}
```
**Response 401 (expired):**
```json
{
    "status": false,
    "message": "Token sudah kadaluarsa",
    "data": { "valid": false, "code": "TOKEN_EXPIRED" }
}
```

---

### POST /api/auth/refresh-token
**Header:** `Authorization: Bearer {token_lama}`

**Response 200:**
```json
{
    "status": true,
    "message": "Token berhasil diperbarui",
    "data": {
        "token": {
            "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci... (token baru)",
            "token_type": "Bearer",
            "expires_in": 3600,
            "expires_at": "2025-01-01 14:00:00"
        }
    }
}
```

## ⚠️ Error Code Reference

| Code              | Artinya                                        |
|-------------------|------------------------------------------------|
| `TOKEN_EXPIRED`   | Token sudah melewati TTL                       |
| `TOKEN_INVALID`   | Token palsu atau rusak (signature tidak cocok) |
| `TOKEN_ABSENT`    | Tidak ada token di header Authorization        |
| `REFRESH_EXPIRED` | Token melewati refresh_ttl, harus login ulang  |
| `REFRESH_FAILED`  | Gagal teknis saat refresh                      |