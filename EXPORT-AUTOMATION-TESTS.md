# Automation Export berdasarkan Role

Dokumen ini menjelaskan test export pada Internal Memo, Penerima, Instansi,
Banner, dan riwayat pembayaran Banner. Test bersifat read-only: test hanya login,
membuka halaman, membuka dialog export, dan mengunduh file ke folder artefak
Playwright.

Implementasi mengikuti dokumentasi resmi Playwright untuk
[locators](https://playwright.dev/docs/locators),
[downloads](https://playwright.dev/docs/downloads),
[test isolation](https://playwright.dev/docs/browser-contexts), dan
[best practices](https://playwright.dev/docs/best-practices).

## Matriks akses staging

Matriks ini diverifikasi langsung pada staging tanggal 11 November 2026. `Ya`
berarti test mengklik export dan memvalidasi file. `Tidak` berarti test memastikan
tombol atau halaman export tidak diberikan kepada role tersebut.

| Role | Internal Memo | Penerima | Instansi | Banner | Banner Detail |
|---|---:|---:|---:|---:|---:|
| Super Admin | Ya | Ya | Ya | Ya | Ya |
| Wakil Direktur | Ya | Ya | Ya | Ya | Ya |
| General Manager | Ya | Ya | Tidak | Tidak | Tidak |
| SVP Legal | Ya | Ya | Ya | Ya | Ya |
| Admin Legal | Ya | Ya | Ya | Ya | Ya |
| Staff Finance | Ya | Ya | Tidak | Ya | Ya |

Jika permission aplikasi berubah, ubah hanya `exportPermissions` pada
`tests/features/export/data/export.data.ts`. Perubahan permission yang belum disepakati akan
terlihat sebagai test gagal, bukan false pass.

## Test scenario dan acceptance criteria

### Scenario 1 — export daftar yang diizinkan

1. BrowserContext baru dibuat otomatis oleh Playwright.
2. User login menggunakan credential role dari `.env`.
3. Response login diverifikasi memiliki nama role backend yang benar.
4. Test membuka halaman target.
5. Tombol `Export` harus unik, terlihat, dan berada di viewport.
6. Dialog export harus tampil dengan judul sesuai halaman.
7. Listener download dipasang sebelum tombol `Export` dalam dialog diklik.
8. Download harus selesai tanpa failure.
9. Nama file harus mengikuti pola `<fitur>-YYYY-MM-DD.xlsx`.
10. File harus berukuran lebih dari nol dan mempunyai signature `PK`, yaitu
    signature ZIP yang digunakan format XLSX.
11. File dilampirkan ke HTML report Playwright.

### Scenario 2 — export riwayat pembayaran Banner

1. Test mencari cabang referensi, default `GGP001`.
2. Test membuka detail cabang melalui row tabel, lalu link `Riwayat Pembayaran`.
3. Tombol `Export Pembayaran` harus unik, terlihat, dan berada di viewport.
4. Dialog `Export Riwayat Pembayaran` harus tampil.
5. File harus mengikuti pola
   `riwayat-pembayaran-<kode-cabang>-YYYY-MM-DD.xlsx`.
6. Validasi failure, ukuran, signature XLSX, dan attachment report sama dengan
   export daftar.

Cabang referensi dapat diganti tanpa mengubah kode:

```dotenv
LEGAL_EXPORT_BANNER_BRANCH_CODE=GGP001
```

Cabang tersebut harus tersedia di tabel Banner dan memiliki data yang dapat
diekspor.

### Scenario 3 — authorization negatif

Role yang tidak memiliki permission tidak dilewati. Test tetap login sebagai role
tersebut dan memastikan tombol export tidak tersedia atau route detail dialihkan.
Ini mendeteksi kebocoran permission ketika developer mengubah guard atau menu.

## Penjelasan setiap bagian kode

### Struktur feature Export

- `tests/features/export/types/export.types.ts`: kontrak type export.
- `tests/features/export/data/export.data.ts`: target dan permission matrix.
- `tests/features/export/pages/export.page.ts`: locator dan interaksi UI.
- `tests/features/export/support/spreadsheet.ts`: validasi file XLSX.
- `tests/features/export/specs/export-by-role.spec.ts`: skenario per role.

### `tests/features/export/pages/export.page.ts`

#### Import

- `expect` menyediakan web-first assertion yang otomatis menunggu kondisi UI.
- `Locator`, `Page`, dan `TestInfo` adalah type Playwright; keyword
  `type` memastikan import tersebut hilang pada runtime.

#### Type dan metadata

- `ListExportId`, `ExportTargetId`, dan `ListExportTarget` berada di folder
  `types/`, tidak bercampur dengan Page Object.
- `listExportTargets` dan `exportPermissions` berada di folder `data/` sebagai
  single source of truth.

Setiap object pada `listExportTargets` mempunyai arti berikut:

- `id`: ID stabil untuk permission, tag, dan nama test.
- `route`: URL relatif terhadap `baseURL` staging.
- `pageHeading`: heading yang wajib terlihat sebelum tombol digunakan.
- `dialogHeading`: accessible name dialog yang wajib muncul.
- `filePrefix`: awalan nama file yang dikembalikan aplikasi.

#### Helper file

- `escapeRegExp()` pada `support/spreadsheet.ts` mengamankan karakter khusus sebelum prefix dimasukkan ke
  regular expression.
- `datedXlsxPattern()` membentuk pola nama file bertanggal tanpa hard-code tanggal
  hari test dijalankan.

#### Class `ExportPage`

- `constructor(readonly page: Page)` menyimpan tab browser untuk seluruh method.
- `exactExportButton()` memusatkan locator tombol `Export` dan memakai role serta
  accessible name, sesuai rekomendasi Playwright.
- `gotoList()` membuka route, memeriksa pathname, lalu menunggu heading halaman.
- `expectListExportPlacement()` memastikan tombol hanya satu, terlihat, dan berada
  di viewport. Assertion ini menguji placement fungsional tanpa pixel coordinate.
- `downloadListExport()` membuka dialog, memasang listener download sebelum klik,
  lalu menyerahkan file ke validator bersama pola nama.
- `expectListExportUnavailable()` menangani dua bentuk denial staging: redirect
  dari Instansi atau halaman yang tetap terbuka tetapi tidak memberi tombol.
- `gotoBannerPaymentHistory()` mencari kode cabang melalui search, menunggu update
  router/API stabil, lalu memilih row yang memiliki cell dengan kode persis.
  Tombol icon tanpa accessible name dilokasikan di dalam row target agar scope
  tetap sempit.
- Dua `Promise.all()` memasang penantian URL sebelum klik navigasi dilakukan.
- `downloadBannerPaymentHistory()` menjalankan navigasi, memeriksa placement
  `Export Pembayaran`, membuka dialog, dan menunggu download.
- `expectBannerPaymentHistoryUnavailable()` memastikan role terlarang tidak dapat
  masuk ke detail Banner walaupun mencoba melalui row tabel.
- `verifySpreadsheetDownload()` di folder `support/` memeriksa failure, nama file, isi non-kosong, signature
  `PK`, lalu menyimpan file sebagai attachment report.

#### Urutan penting event download

```ts
const downloadPromise = page.waitForEvent('download');
await exportButton.click();
const download = await downloadPromise;
```

Baris pertama harus dibuat sebelum klik. Jika listener dibuat setelah klik, event
yang cepat dapat terlewat dan test menjadi flaky.

### `tests/features/export/specs/export-by-role.spec.ts`

#### Import dan data

- `test` digunakan untuk test, `describe`, `step`, fixture `page`, dan `testInfo`.
- `loginRoles` menjadi sumber keenam role sehingga username tidak ditulis ulang.
- `ExportPage` memusatkan locator dan action export.
- `listExportTargets` menghasilkan empat test daftar untuk setiap role.
- `loginAsLoginRole()` menggunakan flow login dan verifikasi role yang reusable.

#### Permission dan data cabang

- `exportPermissions` menyatakan target yang boleh diekspor setiap role.
- Role atau target yang tidak ada di array dianggap tidak mempunyai permission.
- `paymentHistoryBranch` membaca kode cabang dari `.env` dan memakai `GGP001`
  sebagai default yang saat ini mempunyai riwayat pembayaran di staging.
- `test.use()` memaksa tiap test dimulai tanpa cookie atau localStorage lama.

#### Helper login

- Detail pembacaan credential dan login berada di feature Auth agar tidak
  diduplikasi oleh spec Export.

#### Parameterization

- Loop luar `for (const role of loginRoles)` membuat suite untuk setiap role.
- Loop dalam `for (const target of listExportTargets)` membuat empat test daftar.
- `isAllowed` menentukan positive atau negative authorization path.
- `targetTag` memberi tag unik agar command per halaman tidak salah memilih Banner
  Detail.
- Nama test memuat TC ID, tag, role, halaman, dan expected result sehingga mudah
  dibaca di VS Code dan HTML report.
- Setiap callback membuat `ExportPage` untuk fixture `page` milik test itu sendiri.
- `test.step()` memisahkan tahap login dan export di report.
- Positive path memanggil `downloadListExport()`.
- Negative path memanggil `expectListExportUnavailable()`.
- Test Banner Detail dibentuk terpisah karena membutuhkan navigasi berjenjang dan
  tombol bernama `Export Pembayaran`.

Total yang terbentuk adalah 30 test independen: 6 role × 5 target.

## Command

```powershell
npm.cmd run test:export
npm.cmd run test:export:headed
npm.cmd run test:export:internal-memo
npm.cmd run test:export:penerima
npm.cmd run test:export:instansi
npm.cmd run test:export:banner
npm.cmd run test:export:banner-detail
```

Di VS Code, buka `tests/features/export/specs/export-by-role.spec.ts`. Extension Playwright akan
menampilkan tombol play pada setiap test yang dihasilkan. Pilih satu role/area
untuk menjalankan kasus itu saja.

## Jika fitur berubah

- Halaman export baru: tambah metadata di `listExportTargets`, lalu tambah ID ke
  role yang berhak pada `exportPermissions`.
- Accessible name tombol berubah: perbarui satu locator di `ExportPage`.
- Judul dialog atau prefix file berubah: perbarui metadata target.
- Permission berubah: perbarui `exportPermissions` setelah requirement disetujui.
- Format bukan XLSX lagi: buat validator baru; jangan menghapus pemeriksaan isi
  hanya supaya test lulus.
- Tombol icon Banner sudah diberi `aria-label`: ganti fallback row button dengan
  `getByRole('button', { name: 'Lihat detail' })`.

File hasil test berada di `test-results` dan attachment HTML report, bukan folder
kerja permanen. Folder tersebut sudah diabaikan Git.
