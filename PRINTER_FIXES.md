# Printer Detection & Test Print Fixes

## Masalah yang Diperbaiki

### 1. **Test Print Handler Tidak Terdaftar**
   - **Masalah**: Handler `ipcMain.handle('test-print')` berada di dalam handler `print-receipt`, menyebabkannya tidak terdaftar dengan benar
   - **Solusi**: Memindahkan handler ke level yang sama (sesuai level printer-receipt)
   - **File**: `electron/main.js`

### 2. **Deteksi Printer Tidak Menampilkan Detail**
   - **Masalah**: Hanya menampilkan VID dan PID, tidak ada informasi manufacturer atau product name
   - **Solusi**: 
     - Menambah pengambilan `manufacturer` dan `product` dari descriptor
     - Menambah logging yang lebih detail untuk debug
     - Menampilkan informasi printer di UI
   - **File**: `electron/main.js`, `src/components/PrinterSettings.jsx`

### 3. **Error Handling Tidak Informatif**
   - **Masalah**: Pesan error tidak detail, sulit untuk debug
   - **Solusi**:
     - Menambah `console.error` dan `console.log` di Electron
     - Menampilkan error message lengkap di UI
     - Menambah section debug info yang collapsible
   - **File**: `src/components/PrinterSettings.jsx`

## Perubahan Detail

### electron/main.js

#### 1. Handler `get-usb-printers` (diperbaiki)
```javascript
- Menambah error handling yang lebih baik
- Menambah pengambilan manufacturer & product
- Menambah logging untuk setiap printer yang ditemukan
- Return struktur data yang lebih informatif
```

#### 2. Handler `test-print` (dipindahkan)
```javascript
- Dipindahkan dari dalam print-receipt ke level teratas
- Tetap mempertahankan fungsi yang sama
- Menutup print-receipt handler dengan benar
```

### src/components/PrinterSettings.jsx

#### 1. Tampilan Printer (ditingkatkan)
```jsx
- Menampilkan manufacturer atau product name jika tersedia
- Fallback ke "USB Printer #X" jika tidak ada info
- Menampilkan VID dan PID dengan format lebih jelas
```

#### 2. Error Handling (ditingkatkan)
```jsx
- handleScan: Better error message dan logging
- handleTest: Detailed error message di UI
```

#### 3. Debug Info Section (ditambahkan)
```jsx
- Collapsible panel untuk info debug
- Menampilkan status Electron API
- Menampilkan jumlah printer yang terdeteksi
- Menampilkan detail setiap printer
- Menampilkan last scan error jika ada
```

## Cara Menggunakan

### 1. **Scan Printer**
   - Klik tombol "Scan" untuk mencari printer yang terhubung
   - Jika printer ditemukan, akan ditampilkan dengan nama manufacturer dan product

### 2. **Select Printer**
   - Klik printer yang ingin dipilih
   - Status "Active" akan ditampilkan

### 3. **Test Print**
   - Pastikan printer sudah dipilih
   - Klik tombol "Test Print"
   - Periksa printer untuk output test

### 4. **Debug (jika ada masalah)**
   - Buka bagian "Debug Info" di bawah
   - Lihat status Electron API
   - Lihat detail printer yang terdeteksi
   - Lihat error message terakhir jika ada scanning error

## Troubleshooting

Jika printer masih tidak terdeteksi:

1. **Pastikan driver WinUSB terinstall**
   - Download Zadig dari: zadig.akeo.ie
   - Buka Zadig → Options → List All Devices
   - Cari printer Anda → Pilih WinUSB driver → Replace Driver
   - Restart aplikasi

2. **Periksa koneksi USB**
   - Pastikan kabel USB terhubung dengan baik
   - Pastikan printer dalam kondisi ON
   - Coba port USB lain jika ada

3. **Lihat Debug Info**
   - Buka Debug Info section
   - Jika "Electron API Available: No", aplikasi tidak berjalan di Electron
   - Lihat detail error di "Last Scan Error"

4. **Check Console Log (dev mode)**
   - Buka DevTools (F12)
   - Lihat tab Console untuk detail error dari Electron
