# Panduan Instalasi — Portal Magang / PKL Semester 7

Dua bagian: **Backend** (Google Apps Script) lalu **Frontend** (GitHub Pages).

## BAGIAN 1 — Backend (Google Apps Script)

1. Buka https://script.google.com → **Proyek Baru**.
2. Ganti nama `Code.gs` menjadi `Kode`, hapus isinya, tempel seluruh isi **Kode.gs**.
3. Klik ikon ⚙ **Project Settings** → centang **Show "appsscript.json" manifest file**. Buka `appsscript.json` di editor, ganti isinya dengan file **appsscript.json** yang diberikan.
4. Pilih fungsi **setupAppEnvironment** → ▶ Run (**HANYA SEKALI**). Izinkan akses Drive & Sheets.
5. Buka **Execution log**. Catat baris `ADMIN LOGIN → username: admin | password: ...` (password acak, simpan!).
6. Pilih fungsi **installTriggers** → ▶ Run (sinkronisasi harian 02:00 + keep-warm 5 menit agar tidak lambat saat pertama dibuka).
7. (Tidak perlu lagi mengisi Script Properties.) Tautan sumber data diisi nanti **di dalam aplikasi**: login admin → Pengaturan → *Sumber Data Sinkronisasi*.
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

## UPDATE dari versi 1 ke versi 2 (periode + sumber data dari aplikasi)

**Backend (sekali saja)**
1. Buka proyek Apps Script, ganti seluruh isi `Kode` dengan **Kode.gs** terbaru, Ctrl+S.
2. Pilih fungsi **`upgradeKeV2`** → ▶ Run. Log harus menampilkan "kolom periode ditambahkan" untuk Mahasiswa, Foto, Laporan, Nilai, lalu "Upgrade v2 selesai". Data lama otomatis diberi periode aktif sekarang.
3. **Deploy → Manage deployments → ✏ → Version: New version → Deploy.** URL `/exec` tetap sama, `config.js` tidak perlu diubah.
4. Script Property `REKAP_SS_ID` / `REKAP_SHEET` (jika sudah dibuat) boleh dihapus; tidak dipakai lagi.

**Frontend**: ekstrak ZIP baru, salin isi `js/`, `css/`, `index.html` menimpa file lama (jangan menimpa `js/config.js` jika sudah berisi URL Anda; atau isi ulang URL-nya), lalu di PowerShell: `git add .` → `git commit -m "update v2"` → `git push`, lalu Ctrl+Shift+R.

**Mengisi sumber data (di aplikasi)**
1. Login admin → **Pengaturan** → kartu *Sumber Data Sinkronisasi*.
2. Tempel tautan spreadsheet **Aplikasi Surat** (wajib) dan **Rekap Mahasiswa** (opsional). Kedua spreadsheet harus bisa dibuka oleh akun Google pemilik script (bagikan sebagai Viewer).
3. Klik **1. Uji Tautan & Atur Kolom** → cek kolom yang terdeteksi (NIM, Perihal, Tempat magang, Dosen pembimbing) → Simpan.
4. Klik **2. Pratinjau Hasil** → lihat siapa yang layak masuk dan siapa yang dilewati beserta alasannya.
5. Klik **3. Sinkronkan Sekarang**. Dua mahasiswa contoh otomatis dinonaktifkan.

**Aturan masuk:** baris surat dengan perihal berisi kata kunci (default "verifikasi tempat magang"), punya NIM, tempat magang, dan dosen pembimbing. Jika Rekap diisi, mahasiswa juga harus semester 7. Mahasiswa yang tidak memenuhi tidak masuk dan tidak bisa login.

## Pemakaian tahunan
1. Saat angkatan baru: Pengaturan → **Mulai Periode Baru** (isi nama periode, bulan/tahun mulai, durasi).
2. Jalankan **Sinkronkan Sekarang** untuk memasukkan mahasiswa periode baru.
3. Data periode lama tetap aman: Rekap → pilih periode di dropdown (mode arsip, baca-saja). **Ekspor CSV** tersedia untuk laporan per periode.
Folder Drive juga dipisah per periode (Uploads/2026-2027/NIM/...).
