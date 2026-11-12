# Advanced Internal Memo Creation — Test Scenario dan Test Case

Suite ini menguji variasi pembuatan Internal Memo yang lebih kompleks: KR untuk
seluruh cabang, metode pembayaran RR, 20 pembayaran, dan seluruh cabang yang
tersedia pada Kota Jakarta Barat.

## Ruang lingkup dan batasan

- Memo dibuat sebagai Draft melalui UI menggunakan akun Admin Legal.
- Setiap test memakai nomor unik berprefix `IM ADV/`.
- Kota pembuatan memo adalah `Kota Jakarta Barat`, sesuai data automation saat ini.
- `Semua cabang Jakarta` pada RR berarti seluruh cabang yang dikembalikan UI untuk
  kota tersebut. Saat inspeksi 6 November 2026 terdapat 25 cabang.
- KR menggunakan switch resmi `Berlaku untuk semua cabang`, sehingga cakupannya
  mengikuti definisi seluruh cabang dari aplikasi.
- Automation membatasi input RR maksimal 20 pembayaran. Saat inspeksi, tombol
  `Tambah pembayaran` masih tersedia setelah baris ke-20; suite tidak menganggap
  UI telah menerapkan limit bisnis 20.

## Test scenario

| ID | Scenario | Hasil yang diharapkan |
|---|---|---|
| `TC-MEMO-KR-ALL-BRANCHES-001` | KR berlaku untuk seluruh cabang | Switch aktif, draft tersimpan, detail memuat lebih dari satu cabang |
| `TC-MEMO-RR-METHOD-TUNAI-001` | RR dengan pembayaran Tunai | Draft tersimpan dan detail menampilkan `Tunai` |
| `TC-MEMO-RR-METHOD-TRANSFER-001` | RR dengan pembayaran Transfer | Draft tersimpan dan detail menampilkan `Transfer` |
| `TC-MEMO-RR-METHOD-VA-001` | RR dengan pembayaran VA | Draft tersimpan dan detail menampilkan `VA` |
| `TC-MEMO-RR-20-PAYMENTS-001` | Satu cabang RR memiliki tepat 20 pembayaran | Draft tersimpan dan detail menampilkan `20 pembayaran` |
| `TC-MEMO-RR-SELECT-ALL-JAKARTA-BRANCHES-001` | RR memilih semua cabang yang tersedia di Jakarta Barat | Setiap cabang dapat dipilih satu kali pada form; memo tidak disimpan karena prerequisite banner belum lengkap |

## Test case

### TC-MEMO-KR-ALL-BRANCHES-001

1. Login sebagai Admin Legal.
2. Buka form Memo Koordinasi.
3. Isi PIC, nomor IM unik, Kota Jakarta Barat, deskripsi, instansi, penerima,
   rekening, nominal, dan lampiran.
4. Lanjut ke step Rincian Cabang.
5. Isi jangka waktu.
6. Aktifkan switch `Berlaku untuk semua cabang`.
7. Pastikan switch checked dan input cabang individual menghilang.
8. Simpan memo dan pastikan response berhasil.
9. Buka detail memo.
10. Pastikan jumlah cabang lebih dari satu dan teks `Berlaku untuk seluruh cabang`
    terlihat.

### TC-MEMO-RR-METHOD-TUNAI/TRANSFER/VA-001

Untuk setiap metode dilakukan test mandiri:

1. Login sebagai Admin Legal dan buka form Memo Resmi.
2. Isi informasi memo serta lampiran.
3. Pilih satu cabang dan satu banner valid.
4. Pilih metode yang sedang diuji.
5. Isi tujuan pembayaran dan nominal.
6. Simpan memo dan pastikan response berhasil.
7. Buka detail memo.
8. Pastikan terdapat satu cabang, satu pembayaran, dan metode yang dipilih tampil.

### TC-MEMO-RR-20-PAYMENTS-001

1. Login sebagai Admin Legal dan buka Memo Resmi.
2. Pilih satu cabang.
3. Tambahkan pembayaran sampai tepat 20 baris.
4. Pada setiap baris pilih banner valid, metode Tunai, tujuan unik, dan nominal.
5. Pastikan form memiliki tepat 20 input nominal pembayaran.
6. Simpan memo dan pastikan response berhasil.
7. Buka detail dan pastikan tertulis `20 pembayaran`.

Guard pada Page Object menolak data automation di bawah satu atau di atas 20 agar
script tidak membuat payload staging yang tidak disengaja.

### TC-MEMO-RR-SELECT-ALL-JAKARTA-BRANCHES-001

1. Login sebagai Admin Legal dan pilih Kota Jakarta Barat.
2. Buka daftar cabang pada step 2 dan simpan seluruh nama yang ditawarkan UI.
3. Pilih setiap cabang tepat satu kali dan isi jangka waktunya.
4. Pastikan jumlah bagian Rincian Cabang sama dengan jumlah opsi unik dari UI.
5. Hentikan test sebelum submit agar tidak membuat payload RR yang tidak valid.

Full-save seluruh cabang belum dapat diotomasi secara valid pada data staging saat
ini. Verifikasi menemukan cabang `GGP006` tidak memiliki pilihan Banner, sementara
setiap cabang RR mewajibkan minimal satu banner dan rincian pembayaran. Setelah data
Banner GGP006 tersedia, test ini dapat diperluas untuk mengisi pembayaran setiap
cabang dan menyimpan Draft.

## Command

```powershell
# Semua advanced creation
npm.cmd run test:create-memo:advanced

# KR seluruh cabang
npm.cmd run test:create-memo:kr:all-branches

# RR berdasarkan metode pembayaran
npm.cmd run test:create-memo:rr:tunai
npm.cmd run test:create-memo:rr:transfer
npm.cmd run test:create-memo:rr:va

# RR tepat 20 pembayaran
npm.cmd run test:create-memo:rr:20-payments

# RR seluruh cabang yang tersedia di Jakarta Barat
npm.cmd run test:create-memo:rr:all-jakarta-branches
```

Semua command bersifat mutating dan membutuhkan:

```dotenv
LEGAL_ALLOW_MEMO_CREATE=true
```

Struktur menggunakan locator yang dilihat pengguna, web-first assertion, Page
Object, dan data per-test yang independen, sesuai dokumentasi resmi Playwright:

- [Best practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Test isolation](https://playwright.dev/docs/browser-contexts)
