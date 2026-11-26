# Panduan Instalasi — Portal Magang / PKL Semester 7

Dua bagian: **Backend** (Google Apps Script) lalu **Frontend** (GitHub Pages).

## BAGIAN 1 — Backend (Google Apps Script)

1. Buka https://script.google.com → **Proyek Baru**.
2. Ganti nama `Code.gs` menjadi `Kode`, hapus isinya, tempel seluruh isi **Kode.gs**.
3. Klik ikon ⚙ **Project Settings** → centang **Show "appsscript.json" manifest file**. Buka `appsscript.json` di editor, ganti isinya dengan file **appsscript.json** yang diberikan.
4. Pilih fungsi **setupAppEnvironment** → ▶ Run (**HANYA SEKALI**). Izinkan akses Drive & Sheets.
5. Buka **Execution log**. Catat baris `ADMIN LOGIN → username: admin | password: ...` (password acak, simpan!).
6. Pilih fungsi **installTriggers** → ▶ Run (sinkronisasi harian 02:00 + keep-warm 5 menit agar tidak lambat saat pertama dibuka).
7. Hubungkan data mahasiswa: **Project Settings → Script properties → Add**:
   - `REKAP_SS_ID` = ID spreadsheet aplikasi Rekap Mahasiswa (teks di URL antara `/d/` dan `/edit`)
   - `REKAP_SHEET` = nama sheet (opsional)
   Kolom yang dikenali: NIM, Nama, Semester, Prodi, Mitra/Instansi, Pembimbing. Hanya semester 7 yang aktif.
   Tanpa sumber, isi sheet **Mahasiswa** di Spreadsheet database secara manual (status_akses = `aktif`, semester = `7`). Dua baris contoh sudah ada — hapus sebelum dipakai nyata.
8. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** → Deploy → **salin URL `/exec`**.
9. (Opsional) Ganti password admin: edit `PASSWORD` di fungsi `setAdminPassword`, Run, lalu hapus password dari kode.

> Setiap mengubah Kode.gs: **Deploy → Manage deployments → ✏ → Version: New version → Deploy**.

## BAGIAN 2 — Frontend (GitHub Pages)

**Folder kerja = hasil ekstrak ZIP, yaitu folder `pkl-portal`.** Di dalamnya harus langsung terlihat `index.html`, `css`, `js`. Di folder inilah `git init` dijalankan — jangan masuk lebih dalam, jangan naik satu level.

1. Ekstrak ZIP. Buka `js/config.js`, ganti `GANTI_DENGAN_URL_EXEC_APPS_SCRIPT` dengan URL `/exec` dari langkah 8. Simpan.
2. Buat repository **Public** baru di github.com (jangan centang README/.gitignore/license).
3. Buka PowerShell di folder `pkl-portal` (File Explorer → klik address bar → ketik `powershell` → Enter). Cek:
   ```
   dir
   ```
   Wajib terlihat `index.html`, `css`, `js`.
4. Jalankan satu per satu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
   Saat diminta password, tempel **Personal Access Token** (GitHub → Settings → Developer settings → Tokens (classic) → scope `repo`). Layar tampak kosong saat paste — itu normal.
5. Repo → **Settings → Pages** → Deploy from a branch → `main` / `/ (root)` → Save. Tunggu 1–2 menit; situs: `https://USERNAME.github.io/NAMA-REPO/`.
6. Update berikutnya: `git add .` → `git commit -m "update"` → `git push`, lalu Ctrl+Shift+R.

## Uji coba
- Admin: login admin → Pengaturan: isi **Simulasi tanggal** (mis. 2026-11-15) untuk menguji bulan terbuka bertahap; kosongkan setelahnya.
- Mahasiswa: login NIM contoh `21010119120045` → unggah foto → admin verifikasi (✔/✘) → cek rekap.
- Dosen: Pengaturan → Buat Token Dosen → masuk dengan token.
- Pilot ±10 mahasiswa & 1–2 dosen sebelum dibuka untuk semua.

## Catatan teknis
- Berkas Drive tidak publik; tampil lewat aplikasi (API `getFile`) dengan pemeriksaan hak akses.
- Sesi berlaku 6 jam (batas CacheService); setelah itu login ulang.
- Kuota GAS (waktu 6 menit/eksekusi, kuota harian Drive) perlu diuji pada beban puncak ±300 pengguna.
