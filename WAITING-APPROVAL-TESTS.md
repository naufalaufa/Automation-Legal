# Waiting Approval Hierarchy — Test Scenario dan Test Case

Suite ini memvalidasi perpindahan Internal Memo berdasarkan hierarki approval dan
berhenti sebelum reviewer tujuan mengambil keputusan. Fokusnya bukan pembayaran,
melainkan memastikan memo benar-benar masuk ke antrean role yang tepat.

## Ruang lingkup

Alur yang diuji:

```text
Admin Legal membuat RR
  → Kirim Memo
  → Waiting SPV
  → SVP approve
  → Waiting GM
  → GM approve
  → Approve GM / siap direview Wakil Direktur
```

Staging saat ini tidak menampilkan label `Waiting VP`. Setelah GM menyetujui memo,
status UI adalah `Approve GM`. Karena itu antrean Wakil Direktur divalidasi dengan
tiga bukti sekaligus:

1. Status memo `Approve GM`.
2. Memo dapat dibuka menggunakan akun Wakil Direktur.
3. Tombol `Setujui` dan `Tolak` tersedia untuk Wakil Direktur.

## Prasyarat

- Legal staging dapat diakses.
- Credential Admin Legal, SVP Legal, General Manager, dan VP/Wakil Direktur terisi
  di `.env`.
- Data master RR Kota Jakarta Barat tersedia.
- Fixture `tests/fixtures/memo-automation.png` tersedia.
- `LEGAL_ALLOW_WAITING_APPROVAL=true` diaktifkan secara sadar.

## Test scenario

| Scenario | Tujuan | Aktor terakhir | Kondisi akhir |
|---|---|---|---|
| Waiting SVP | Memastikan memo yang dikirim Admin masuk antrean SVP | SVP Legal | `Waiting SPV` |
| Waiting GM | Memastikan approval SVP meneruskan memo ke GM | General Manager | `Waiting GM` |
| Waiting Wakil Direktur | Memastikan approval GM meneruskan memo ke Wakil Direktur | Wakil Direktur | `Approve GM`, action approval tersedia |

## Test case

### TC-WAIT-SVP-001 — Memo berhenti pada Waiting SPV

Precondition: akun Admin Legal dan SVP Legal aktif.

Langkah:

1. Login sebagai Admin Legal menggunakan BrowserContext baru.
2. Buat Memo Resmi dengan nomor unik berprefix `IM WAIT/RR/`.
3. Pastikan API pembuatan memo berhasil dan memo tampil pada daftar.
4. Buka detail memo yang baru dibuat.
5. Klik `Kirim Memo` dan konfirmasi.
6. Pastikan status berubah menjadi `Waiting SPV`.
7. Tutup session Admin Legal.
8. Login sebagai SVP Legal menggunakan BrowserContext baru.
9. Buka memo berdasarkan ID dan nomor IM yang sama.
10. Pastikan status `Waiting SPV` serta tombol `Setujui` dan `Tolak` tampil.

Expected result: memo menunggu keputusan SVP Legal dan tidak diproses lebih lanjut.

### TC-WAIT-GM-001 — Memo berhenti pada Waiting GM

Precondition: akun Admin Legal, SVP Legal, dan General Manager aktif.

Langkah:

1. Buat dan kirim memo baru sampai `Waiting SPV`.
2. Login sebagai SVP Legal pada BrowserContext terpisah.
3. Setujui memo dan pastikan response approval berhasil.
4. Pastikan status berubah menjadi `Waiting GM`.
5. Tutup session SVP Legal.
6. Login sebagai General Manager pada BrowserContext baru.
7. Buka memo yang sama.
8. Pastikan status `Waiting GM` serta tombol `Setujui` dan `Tolak` tampil.

Expected result: memo menunggu keputusan General Manager dan tidak diproses ke
Wakil Direktur.

### TC-WAIT-VP-001 — Memo berhenti menunggu Wakil Direktur

Precondition: akun Admin Legal, SVP Legal, General Manager, dan Wakil Direktur aktif.

Langkah:

1. Buat dan kirim memo baru sampai `Waiting SPV`.
2. Login sebagai SVP Legal dan setujui memo.
3. Login sebagai General Manager pada BrowserContext baru.
4. Setujui memo dan pastikan response approval berhasil.
5. Pastikan status berubah menjadi `Approve GM`.
6. Tutup session General Manager.
7. Login sebagai Wakil Direktur pada BrowserContext baru.
8. Buka memo yang sama.
9. Pastikan status `Approve GM` serta tombol `Setujui` dan `Tolak` tampil.

Expected result: memo siap direview Wakil Direktur tetapi belum disetujui atau
ditolak oleh Wakil Direktur.

## Menjalankan automation

Jalankan seluruh hierarchy:

```powershell
npm.cmd run test:waiting-approval
```

Jalankan satu kondisi akhir saja:

```powershell
npm.cmd run test:waiting:svp
npm.cmd run test:waiting:gm
npm.cmd run test:waiting:vp
```

File `tests/features/internal-memo/specs/legal-waiting-approval.spec.ts` juga dapat dibuka di VS Code dan setiap
test dapat dijalankan melalui tombol play.

## Karakteristik keamanan dan maintainability

- Setiap test membuat memo sendiri dan tidak bergantung pada test lain.
- Nomor memo unik membatasi locator ke data hasil run tersebut.
- Pergantian role memakai BrowserContext terisolasi.
- Locator menggunakan role dan teks yang dilihat pengguna.
- Assertion status dan action menggunakan web-first assertion.
- Endpoint mutating, HTTP method, dan keberhasilan response diperiksa.
- Tidak memakai timeout manual atau ID memo hard-coded.
- Memo sengaja ditinggalkan di antrean sesuai tujuan test.
- Flag mutasi pada `.env.example` bernilai `false` agar tidak otomatis mengubah
  staging milik rekan lain.

Struktur ini mengikuti dokumentasi resmi Playwright untuk
[test isolation](https://playwright.dev/docs/browser-contexts),
[multiple roles](https://playwright.dev/docs/auth), dan
[resilient locators serta web-first assertions](https://playwright.dev/docs/best-practices).

## Jika hierarchy berubah

1. Perbarui status transisi di `tests/features/internal-memo/data/workflow.data.ts`.
2. Tambahkan role/env mapping di `tests/fixtures/legal.fixture.ts` jika ada reviewer
   baru.
3. Tambahkan satu test independen; jangan meneruskan memo dari test lain.
4. Validasi bukan hanya status, tetapi juga akses role dan action yang tersedia.
5. Jalankan satu test case terlebih dahulu sebelum seluruh suite.
