# Penjelasan Test Login Semua Role

Suite ini membuat enam test login sukses yang independen: Super Admin, VP,
General Manager, SVP Legal, Admin Legal, dan Staff Finance.

## Struktur

```text
tests/
├── data/
│   └── login-roles.ts       # Daftar role dan nama environment variable
├── pages/
│   └── login.page.ts        # Locator dan aksi halaman login
└── login-roles.spec.ts      # Skenario login yang dijalankan untuk setiap role
```

## `tests/data/login-roles.ts`

- `LoginRole` menetapkan bentuk data yang wajib dimiliki setiap role.
- `loginRoles` hanya menyimpan label role dan nama environment variable. Tidak
  ada username atau password asli di source code.
- `requiredEnv()` menghentikan test dengan pesan yang jelas jika konfigurasi
  `.env` belum lengkap.
- `credentialsFor()` mengambil username sesuai role dan shared password saat
  test berjalan.

## `tests/pages/login.page.ts`

- `Page` adalah tab browser yang disediakan fixture Playwright.
- `Locator` menyimpan cara Playwright menemukan field dan tombol.
- `getByRole()` dipakai karena Playwright menyarankan locator yang mendekati cara
  pengguna dan assistive technology memahami halaman.
- `goto()` membuka `/login` lewat `baseURL`, kemudian memakai web-first
  assertions untuk menunggu form siap.
- `login()` hanya menjalankan perilaku pengguna: isi username, isi password,
  lalu klik `Masuk`.

## `tests/login-roles.spec.ts`

- `test.use({ storageState: ... })` memastikan setiap test dimulai tanpa sesi.
- `loginRoles.forEach()` adalah parameterized test resmi Playwright. Enam data
  role menghasilkan enam test terpisah dengan nama unik.
- `test.step()` membagi report menjadi tiga langkah yang mudah dibaca: buka
  login, lakukan login, lalu verifikasi dashboard.
- `waitForURL()` menunggu redirect final. Ini penting agar cookie/token selesai
  tersimpan sebelum assertion dashboard.
- `expect(...).toHaveTitle()` dan `toBeVisible()` adalah web-first assertions;
  Playwright akan melakukan retry sampai UI siap atau timeout.
- Identitas akun ikut diperiksa agar test tidak hanya membuktikan bahwa sembarang
  akun dapat membuka dashboard.
- Setiap test otomatis mendapat browser context baru, sehingga cookie dan
  localStorage dari satu role tidak bocor ke role berikutnya.

## Menjalankan

Semua role, headless:

```powershell
npm.cmd run test:login-success
```

Semua role dengan browser terlihat:

```powershell
npm.cmd run test:login-success:headed
```

Satu role dari tombol Play VS Code: buka `tests/login-roles.spec.ts`, lalu klik
segitiga hijau di samping nama test role yang diinginkan.

## Dasar dokumentasi resmi Playwright

- Parameterized tests: https://playwright.dev/docs/test-parameterize
- Environment variables: https://playwright.dev/docs/test-parameterize#passing-environment-variables
- Page Object Model: https://playwright.dev/docs/pom
- Locators: https://playwright.dev/docs/locators
- Assertions: https://playwright.dev/docs/test-assertions
- Authentication: https://playwright.dev/docs/auth
- Best practices: https://playwright.dev/docs/best-practices

Catatan: suite ini sengaja melakukan login UI pada setiap test karena hal yang
sedang diuji adalah proses login itu sendiri. `storageState` sebaiknya digunakan
untuk suite lain yang hanya membutuhkan kondisi sudah login.
