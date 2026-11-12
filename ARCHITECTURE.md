# Test Architecture

Automation Legal memakai struktur feature-first. File dikelompokkan berdasarkan
fitur bisnis, lalu dipisahkan lagi berdasarkan tanggung jawab. Tujuannya agar
perubahan pada satu fitur tidak memaksa engineer mencari file di banyak folder
global yang tidak berkaitan.

Struktur ini mengadaptasi panduan resmi Playwright tentang
[Page Object Model](https://playwright.dev/docs/pom),
[fixtures](https://playwright.dev/docs/test-fixtures),
[parameterized tests](https://playwright.dev/docs/test-parameterize), dan
[test isolation](https://playwright.dev/docs/browser-contexts).

## Struktur folder

```text
tests/
├── features/
│   ├── auth/
│   │   ├── data/       # metadata dan mapping role
│   │   ├── pages/      # LoginPage
│   │   ├── specs/      # login scenarios
│   │   ├── support/    # credential reader dan reusable login
│   │   └── types/      # kontrak auth
│   ├── export/
│   │   ├── data/       # target export dan permission matrix
│   │   ├── pages/      # interaksi halaman/dialog export
│   │   ├── specs/      # skenario export lintas role
│   │   ├── support/    # validator spreadsheet
│   │   └── types/      # kontrak export
│   ├── internal-memo/
│   │   ├── data/       # konfigurasi transisi workflow
│   │   ├── flows/      # orchestration bisnis lintas page/role
│   │   ├── pages/      # Internal Memo dan workflow Page Objects
│   │   ├── specs/      # create, waiting, dan E2E scenarios
│   │   └── types/      # kontrak memo dan workflow
│   └── master-data/
│       ├── data/       # kota dan tipe instansi
│       ├── pages/      # Penerima/Instansi Page Object
│       ├── specs/      # skenario pembuatan master data
│       └── types/      # kontrak master data
├── fixtures/           # fixture Playwright dan file upload test
└── support/            # helper lintas fitur: env, identifier, path
```

## Aturan tanggung jawab

### `types/`

Hanya berisi kontrak TypeScript: `type` dan `interface`. Tidak membaca `.env`,
tidak mengakses browser, dan tidak menyimpan test data.

### `data/`

Berisi data deklaratif dan mapping yang stabil, misalnya permission matrix,
metadata role, daftar kota, dan konfigurasi transisi workflow. Tidak melakukan
klik atau assertion.

### `pages/`

Page Object menyimpan locator, action UI, dan assertion yang melekat pada halaman.
File ini tidak mendefinisikan test case, permission matrix, credential, atau data
scenario. Selector yang berubah cukup diperbaiki di satu tempat.

### `flows/`

Flow mengorkestrasi beberapa Page Object dan role untuk satu proses bisnis,
misalnya create → submit → approve → payment → close. Flow tidak mendeklarasikan
test case; spec-lah yang memutuskan skenario mana yang dijalankan.

### `specs/`

Spec harus mudah dibaca sebagai test scenario: setup/flag, nama test, step bisnis,
dan expected outcome. Detail locator, response endpoint, dan credential tidak
ditulis di sini.

### `support/`

Helper kecil yang reusable. Helper global hanya boleh berisi concern lintas fitur.
Helper spesifik fitur tetap diletakkan di `features/<fitur>/support/`.

### `fixtures/`

Fixture mengelola lifecycle Playwright seperti BrowserContext per role. Fixture
selalu melakukan cleanup setelah `use()` agar session tidak bocor ke test lain.

## Arah dependency

```text
specs ──> flows ──> pages
  │          │         │
  ├──────────┴────────> types
  ├──────────────────> data
  └──────────────────> fixtures/support
```

- `types` tidak boleh mengimpor layer lain, kecuali type library eksternal.
- `data` boleh mengimpor `types`.
- `pages` boleh mengimpor `types`, `data`, dan support teknis.
- `flows` boleh mengimpor Page Objects, types, fixture API, dan support.
- `specs` menjadi composition root; jangan mengimpor spec lain.
- Hindari circular import dan barrel file berlebihan. Import eksplisit membuat
  dependency lebih mudah ditelusuri saat debugging.

## Menambah fitur baru

1. Buat `tests/features/<nama-fitur>/`.
2. Definisikan kontrak pada `types/`.
3. Simpan dataset/mapping pada `data/`.
4. Buat Page Object pada `pages/`.
5. Jika proses melibatkan beberapa halaman/role, buat orchestration di `flows/`.
6. Tulis scenario ringkas di `specs/`.
7. Tambahkan command npm tanpa mengubah nama command yang sudah dipakai tim.
8. Jalankan:

```powershell
npm.cmd run typecheck
npx.cmd playwright test --list
```

Untuk fitur read-only, jalankan suite aktual. Untuk mutating test, pastikan feature
flag staging terkait aktif dan data yang dibuat memang diizinkan.

## Quality gate

- `npm.cmd run typecheck` wajib hijau.
- Semua test harus ditemukan oleh `playwright test --list`.
- Gunakan locator berbasis role/label dan web-first assertion.
- Listener response/download dibuat sebelum action yang memicunya.
- `.env` dan storage state tidak boleh masuk Git.
- Setiap test harus independen atau menggunakan flow yang membuat datanya sendiri.
