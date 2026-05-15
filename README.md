# SIMONPRO - Sistem Monitoring Proyek
## Dinas PU Kota Dumai v1.0

---

## CARA DEPLOY KE VERCEL (Online - Diakses dari HP/Laptop siapapun)

### LANGKAH 1 - Daftar GitHub (gratis)
1. Buka https://github.com
2. Klik Sign up
3. Isi email, password, username
4. Verifikasi email

### LANGKAH 2 - Upload kode ke GitHub
1. Login ke https://github.com
2. Klik tombol hijau "New" untuk buat repository baru
3. Nama repository: simonpro
4. Pilih "Public"
5. Klik "Create repository"
6. Di halaman berikutnya, klik "uploading an existing file"
7. Drag & drop SEMUA file dari folder simonpro (kecuali node_modules)
8. Klik "Commit changes"

### LANGKAH 3 - Deploy ke Vercel
1. Buka https://vercel.com
2. Klik "Sign up" -> pilih "Continue with GitHub"
3. Authorize Vercel
4. Klik "Add New Project"
5. Pilih repository "simonpro"
6. Klik "Deploy"
7. Tunggu 2-3 menit
8. Dapat URL: https://simonpro-xxxx.vercel.app

SELESAI! Aplikasi bisa diakses dari mana saja!

---

## AKUN LOGIN

| Role              | Email                              | Password      |
|-------------------|------------------------------------|---------------|
| PPK               | ppk@dumai.go.id                    | ppk123        |
| Pimpinan          | pimpinan@dumai.go.id               | pimpinan123   |
| PPTK              | pptk1@dumai.go.id                  | pptk123       |
| Tim Perencanaan   | perencanaan@dumai.go.id            | plan123       |
| Tim Pengawasan    | pengawasan@dumai.go.id             | watch123      |
| Konsultan         | konsultan.perencana@mitra.com      | konsultan123  |
| Admin             | admin@dumai.go.id                  | admin123      |

---

## CARA JALANKAN LOKAL (di Laptop/PC)

1. Install Node.js dari https://nodejs.org (pilih LTS)
2. Buka Command Prompt di folder simonpro
3. Ketik: npm install
4. Ketik: npm run dev
5. Buka browser: http://localhost:3000

---

## FITUR SIMONPRO

- Dashboard KPI real-time
- Peta monitoring interaktif (klik marker untuk detail)
- Input laporan harian dengan GPS + foto
- Manajemen masalah & tracking
- Chat per proyek (tersimpan & teraudit)
- Audit log semua aktivitas
- 8 role pengguna berbeda (RBAC)
