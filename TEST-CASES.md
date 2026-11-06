# Test Scenario dan Test Case — Legal Management System

Target: `https://sitedev-legal.pgindonesia.com`  
Prinsip: default test bersifat read-only; satu worker; host staging dikunci di konfigurasi.

## Skenario yang sudah diotomasi

| ID | Skenario | Langkah ringkas | Hasil yang diharapkan | Tag |
|---|---|---|---|---|
| TC-LOGIN-001 | Akses root tanpa sesi | Buka `/` | HTTP 200 dan diarahkan ke `/login` | `@smoke` |
| TC-LOGIN-002 | Tampilan komponen login | Buka `/login` | Judul, username, password, tombol Masuk, versi, dan copyright tampil | `@smoke` |
| TC-LOGIN-003 | Validasi field wajib | Klik Masuk tanpa mengisi data | Pesan username dan password wajib diisi tampil | `@regression` |
| TC-LOGIN-004 | Masking password | Isi password, tampilkan, lalu sembunyikan | Nilai tetap sama; tipe input berubah password → text → password | `@regression` |
| TC-LOGIN-005 | Login akun tidak terdaftar | Isi akun QA yang tidak ada dan submit | API 400, pesan `User tidak ditemukan`, tetap di login | `@negative` |
| TC-UI-001 | Persistensi tema | Pilih mode gelap dan reload | Tema dark dan `aria-pressed` bertahan | `@regression` |
| TC-OBS-001 | Error browser | Muat login sambil menangkap console/page error | Tidak ada error JavaScript browser | `@smoke` |
| TC-RWD-001 | Login mobile | Buka pada viewport 390×844 | Username, password, dan tombol Masuk berada di viewport | `@responsive` |
| TC-AUTH-001 | Login valid | Login memakai akun QA staging | Masuk ke area authenticated dan form login hilang | `@auth` |
| TC-SESSION-001 | Persistensi sesi | Login lalu reload | Sesi tetap aktif dan tidak kembali ke login | `@auth` |
| TC-NAV-001 | Navigasi sesuai role | Deteksi menu yang terlihat lalu buka satu per satu | Semua route yang diizinkan merespons < 400 dan tidak menampilkan halaman error | `@auth` |

`TC-AUTH-001` sampai `TC-NAV-001` otomatis di-skip bila credential belum diisi.
Menu yang dicakup: Dashboard, Internal Memo, Cabang, Kota, Penerima, Instansi,
Banner, Permission, Role, User, dan Versi Aplikasi. Menu diuji sesuai permission akun.

## Skenario lanjutan setelah akun dan test-data policy tersedia

| Area | Positive scenario | Negative/permission scenario | Risiko data |
|---|---|---|---|
| Internal Memo | daftar, pencarian, detail, buat, ubah, lampiran | field wajib, format file, akses tanpa permission | Membuat/mengubah memo |
| Cabang | daftar, filter, detail, tambah, ubah | duplikasi kode/nama, delete yang masih direferensikan | Master data |
| Kota | daftar, pencarian, tambah, ubah | duplikasi dan validasi nama | Master data |
| Penerima | daftar, detail, tambah, ubah | data wajib dan relasi tidak valid | Master data |
| Instansi | daftar, pencarian, tambah, ubah | duplikasi dan field kosong | Master data |
| Banner | daftar, upload, preview, aktif/nonaktif | tipe/ukuran file tidak valid | File dan status publikasi |
| Permission | daftar dan detail permission | direct URL tanpa permission → 403/redirect | Security/RBAC |
| Role | tambah role dan assignment permission | role duplikat atau permission terlarang | Security/RBAC |
| User | tambah, ubah role, aktif/nonaktif | username duplikat dan akses lintas role | Akun pengguna |
| Versi Aplikasi | daftar dan tambah versi | versi duplikat/format tidak valid | Konfigurasi aplikasi |

CRUD belum diaktifkan agar automation tidak mencemari staging. Sebelum dibuat, tetapkan:

1. Akun QA per role.
2. Prefix data automation, misalnya `E2E_`.
3. Data yang boleh dibuat dan dihapus.
4. Strategi cleanup setelah test.
5. Apakah upload menggunakan file dummy khusus QA.
