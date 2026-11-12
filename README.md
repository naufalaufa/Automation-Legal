# Legal Management System — Playwright

Automation untuk Legal PGI staging. Konfigurasi mengunci host staging, memakai satu
worker, menyimpan screenshot/video hanya ketika gagal, dan menghasilkan HTML report.

## Jalankan langsung

```powershell
npm.cmd test
```

Perintah yang tersedia:

```powershell
npm.cmd run test:smoke   # test paling cepat
npm.cmd run test:login   # seluruh validation test halaman login
npm.cmd run test:login-success # login sukses untuk seluruh role
npm.cmd run test:login-success:headed # seluruh role, browser terlihat
npm.cmd run test:e2e:rr # happy path RR sampai Closed
npm.cmd run test:e2e:kr # happy path KR sampai Closed
npm.cmd run test:e2e:workflow # seluruh happy/reject flow (mutating)
npm.cmd run test:create-memo:kr:all-branches # KR untuk seluruh cabang
npm.cmd run test:create-memo:rr:tunai # RR metode Tunai
npm.cmd run test:create-memo:rr:transfer # RR metode Transfer
npm.cmd run test:create-memo:rr:va # RR metode VA
npm.cmd run test:create-memo:rr:20-payments # RR tepat 20 pembayaran
npm.cmd run test:create-memo:rr:all-jakarta-branches # pilih seluruh cabang Jakarta Barat pada form
npm.cmd run test:waiting:svp # berhenti pada antrean SVP
npm.cmd run test:waiting:gm # berhenti pada antrean GM
npm.cmd run test:waiting:vp # berhenti menunggu Wakil Direktur
npm.cmd run test:export # 30 test export lintas 6 role
npm.cmd run test:export:headed # test export dengan browser terlihat
npm.cmd run test:export:banner-detail # khusus riwayat pembayaran Banner
npm.cmd run test:headed  # browser terlihat dan menjalankan seluruh test
npm.cmd run test:ui      # Playwright UI Mode; pilih test lalu klik Run
npm.cmd run test:debug   # Playwright Inspector, step-by-step
npm.cmd run test:report  # buka laporan HTML terakhir
npm.cmd run typecheck    # validasi seluruh type dan import
```

## Test menggunakan akun staging

Salin `.env.example` menjadi `.env`, lalu isi akun QA staging:

```dotenv
LEGAL_USERNAME_ROLE_SUPERADMIN=
LEGAL_USERNAME_ROLE_VP=
LEGAL_USERNAME_ROLE_GENERAL_MANAGER=
LEGAL_USERNAME_ROLE_SVP_LEGAL=
LEGAL_USERNAME_ROLE_ADMIN_LEGAL=
LEGAL_USERNAME_ROLE_STAFF_FINANCE=
LEGAL_PASSWORD=
```

Kemudian jalankan:

```powershell
npm.cmd run test:auth
```

Jika ada credential yang kosong, test role terkait gagal dengan pesan nama variable
yang harus dilengkapi. Credential yang dapat login juga diverifikasi terhadap role
backend target, sehingga username lintas-role tidak menghasilkan false pass.
Validation test login tetap dapat dijalankan secara terpisah.
Jangan commit `.env`, token, atau storage state. Daftar skenario dan test case ada di
`TEST-CASES.md`. Penjelasan kode login per role ada di `LOGIN-ROLE-TESTS.md`.
Dokumentasi workflow lintas role ada di `LEGAL-E2E-WORKFLOW.md`.
Test scenario hierarchy waiting approval ada di `WAITING-APPROVAL-TESTS.md`.
Test scenario advanced memo creation ada di `ADVANCED-MEMO-CREATION-TESTS.md`.
Test export lintas role dan penjelasan kode ada di `EXPORT-AUTOMATION-TESTS.md`.
Panduan struktur folder dan dependency ada di `ARCHITECTURE.md`.

## Catatan browser

Local memakai Google Chrome yang sudah terpasang. Pipeline dengan `CI=true` memakai
Playwright-managed Chromium dan perlu menjalankan `npx playwright install chromium`
sebelum test.
