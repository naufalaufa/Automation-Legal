# Payment History Automation Tests

## Tujuan

Suite ini memvalidasi konsistensi riwayat pembayaran Legal staging pada:

1. Dialog **Pembayaran Terakhir** di detail Internal Memo.
2. Bagian **Riwayat pembayaran sebelumnya** di Memo PDF.
3. Halaman **Riwayat Pembayaran Banner** pada tab RR dan KR.
4. Halaman **Riwayat Pembayaran Penerima**.

## Desain data

Satu eksekusi membuat tepat lima memo dan lima pembayaran:

| Urutan | Tipe | Nominal | Cabang |
|---:|---|---:|---|
| 1 | RR | Rp501.000 | GGP005 |
| 2 | KR | Rp502.000 | GGP005 |
| 3 | RR | Rp503.000 | GGP005 |
| 4 | KR | Rp504.000 | GGP005 |
| 5 | RR | Rp505.000 | GGP005 |

Nomor IM selalu unik. Dua memo KR memakai penerima yang sama agar halaman
Penerima dapat diverifikasi secara deterministik.

## Catatan aturan bisnis

- Banner memiliki tab terpisah **Resmi (RR)** dan **Koordinasi (KR)**. Jika
  kedua tab digabung, terdapat lima transaksi hasil test.
- Penerima hanya berkaitan dengan memo KR. Karena dataset terdiri dari tiga RR
  dan dua KR, halaman Penerima secara benar berisi dua transaksi KR, bukan lima.
- Dialog Internal Memo menampilkan pembayaran **terakhir** per cabang/banner,
  bukan daftar seluruh transaksi. Karena itu dialog divalidasi menggunakan memo
  RR terakhir dan memo KR terakhir.
- PDF menampilkan pembayaran **sebelumnya**. PDF RR terakhir memuat dua RR
  terdahulu, sedangkan PDF KR terakhir memuat satu KR terdahulu.

## Test scenario

### TC-PAYMENT-HISTORY-E2E-001 — Happy path lima pembayaran

**Precondition**

- `LEGAL_BASE_URL` menunjuk ke Legal staging.
- `LEGAL_ALLOW_E2E_WORKFLOW=true`.
- Seluruh credential role berisi akun dengan backend role yang sesuai.
- Cabang `GGP005`, Banner, Instansi RR/KR, dan minimal satu Penerima aktif
  tersedia.

**Langkah utama**

1. Login semua role sebagai preflight, termasuk Audit.
2. Admin Legal membuat memo RR/KR sesuai urutan dataset.
3. Admin Legal mengirim memo.
4. SVP Legal menyetujui memo.
5. General Manager menyetujui memo.
6. Wakil Direktur menyetujui memo.
7. Staff Finance mengunggah bukti pembayaran.
8. Admin Legal menutup memo.
9. Ulangi sampai lima pembayaran selesai.
10. Untuk setiap role, verifikasi surface yang menjadi hak aksesnya.

**Expected result**

- Lima pembayaran berhasil dan berstatus `Closed`.
- Dialog RR dan KR menampilkan transaksi terbaru yang benar.
- PDF memuat bagian riwayat dan nominal pembayaran sebelumnya.
- Banner memuat tiga RR dan dua KR.
- Penerima memuat dua KR untuk penerima yang sama.
- General Manager dapat melihat daftar Banner, tetapi tidak mendapat link atau
  halaman Riwayat Pembayaran Banner.
- Audit dapat membaca seluruh surface tanpa mendapat aksi mutasi workflow.

## Cakupan role

| Role | Dialog Memo | Memo PDF | Banner | Penerima |
|---|---|---|---|---|
| Super Admin | Ya | Ya | Ya | Ya |
| Wakil Direktur | Ya | Ya | Ya | Ya |
| General Manager | Ya | Ya | Tidak | Ya |
| SVP Legal | Ya | Ya | Ya | Ya |
| Admin Legal | Ya | Ya | Ya | Ya |
| Staff Finance | Ya | Ya | Ya | Ya |
| Audit | Ya | Ya | Ya | Ya |

## Pengaman test

- Config Playwright menolak host selain Legal staging.
- Test tidak berjalan jika `LEGAL_ALLOW_E2E_WORKFLOW` bukan `true`.
- Semua akun dan backend role divalidasi sebelum memo pertama dibuat.
- Browser context dibuat terpisah untuk setiap role agar cookie dan session tidak
  bocor.
- Test tidak menghapus atau mengubah data lama.
- Semua memo memakai nomor IM unik dan nominal unik untuk menghindari false
  positive.

## Status verifikasi staging — 13 November 2026

- Lima memo pada run verifikasi terakhir berhasil mencapai `Closed`.
- Dialog **Pembayaran Terakhir**, halaman Banner, dan halaman Penerima konsisten
  dengan dataset lima pembayaran.
- Akses read-only seluruh tujuh role berhasil diverifikasi; General Manager
  dapat melihat daftar Banner tetapi tidak dapat membuka Riwayat Pembayaran.
- PDF RR dan KR dapat diunduh serta diparse, tetapi bagian **Riwayat pembayaran
  sebelumnya** masih menampilkan row lama `04 November 2026 / GGP005 / Rp167`.
  Nominal RR/KR yang baru selesai (`Rp501.000`–`Rp505.000`) tidak muncul pada
  bagian tersebut.
- Assertion PDF sengaja tetap ketat. Suite akan tetap gagal pada validasi isi
  PDF sampai implementasi staging mengembalikan riwayat pembayaran terbaru.

## File yang ditambahkan

- `tests/features/payment-history/data/payment-history.data.ts`
- `tests/features/payment-history/flows/payment-history.flow.ts`
- `tests/features/payment-history/pages/payment-history.page.ts`
- `tests/features/payment-history/specs/payment-history-e2e.spec.ts`
- `tests/features/payment-history/types/payment-history.types.ts`

## File yang disesuaikan

- `.env.example`: menambahkan environment Audit.
- `package.json` dan `package-lock.json`: command test dan parser PDF.
- `tests/features/auth/*`: Audit menjadi role backend tersendiri.
- `tests/features/export/data/export.data.ts`: membedakan akses baca Audit dari
  izin export; Audit dapat membaca surface riwayat tanpa tombol export.
- `tests/features/internal-memo/*`: pemilihan cabang/penerima dapat ditentukan
  serta penerima aktual dapat dikembalikan ke flow.

## Menjalankan test

```powershell
npm.cmd run typecheck
npm.cmd run test:payment-history
```

Mode headed:

```powershell
npm.cmd run test:payment-history:headed
```

## Konfigurasi Audit

`LEGAL_USERNAME_ROLE_AUDIT` wajib menggunakan akun dengan backend role
`audit`. Menggunakan NIK yang sama dengan Staff Finance akan membuat preflight
gagal sebelum ada data staging yang dibuat. Perilaku ini disengaja agar test
tidak menghasilkan PASS palsu untuk role yang salah.
