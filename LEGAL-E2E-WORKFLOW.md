# E2E Internal Memo Legal

Suite ini memvalidasi workflow Internal Memo lintas role melalui browser dan UI
Legal staging. Setiap test membuat memo bernomor unik dengan prefix `IM E2E/`,
sehingga tidak mengambil atau mengubah memo milik test/manual lain.

## Flow yang diuji

| Test case | Tipe | Hasil akhir |
|---|---|---|
| `TC-E2E-RR-HAPPY` | RR | `Closed` |
| `TC-E2E-KR-HAPPY` | KR | `Closed` |
| `TC-E2E-RR-REJECT-SVP` | RR | `Reject SPV` |
| `TC-E2E-RR-REJECT-GM` | RR | `Reject GM` |
| `TC-E2E-RR-REJECT-VP` | RR | `Reject VP` |

Happy path yang tervalidasi di staging:

1. Admin Legal membuat Draft RR/KR dan mengirim memo.
2. SVP Legal menyetujui memo.
3. General Manager menyetujui memo.
4. Wakil Direktur (credential role VP) menyetujui memo.
5. Staff Finance mengunggah bukti pembayaran.
6. Admin Legal mengunggah lampiran penutup dan menutup memo.

Catatan permission: observasi 11 November 2026 menunjukkan role `staff_finance`
masih tersedia, tetapi belum ada user staging yang di-assign ke role tersebut.
Akibatnya dua happy path belum dapat melewati `Waiting Payment` sampai Superadmin
menetapkan akun QA Finance dan username itu diisi pada
`LEGAL_USERNAME_ROLE_STAFF_FINANCE`. Jalur reject SVP/GM/Wakil Direktur tidak
bergantung pada Finance dan tetap dapat dijalankan. Automation memvalidasi role
backend sebelum membuat memo happy-path agar salah konfigurasi tidak meninggalkan
data baru.

Setelah akun Finance tersedia, Staff Finance diharapkan mengunggah bukti pembayaran
dan Admin Legal menutup memo sesuai pembagian aksi terakhir yang tervalidasi.

## Cara menjalankan

Pastikan semua credential role terisi di `.env`, lalu aktifkan pengaman mutasi:

```dotenv
LEGAL_ALLOW_E2E_WORKFLOW=true
```

Jalankan satu skenario agar perubahan staging tetap terkontrol:

```powershell
npm.cmd run test:e2e:rr
npm.cmd run test:e2e:kr
npm.cmd run test:e2e:reject:svp
npm.cmd run test:e2e:reject:gm
npm.cmd run test:e2e:reject:vp
```

Seluruh skenario sekaligus:

```powershell
npm.cmd run test:e2e:workflow
```

Semua command memakai `--headed`. Di VS Code, file
`tests/features/internal-memo/specs/legal-e2e-workflow.spec.ts` juga dapat dibuka lalu tombol play dipilih pada
test case yang dibutuhkan.

## Tanggung jawab setiap file

- `tests/features/internal-memo/specs/legal-e2e-workflow.spec.ts`: skenario bisnis.
- `tests/features/internal-memo/flows/memo-workflow.flow.ts`: orchestration lintas role.
- `tests/fixtures/legal.fixture.ts`: membuat session login baru untuk setiap role,
  memastikan cookie tidak bocor, dan selalu menutup BrowserContext.
- `tests/features/internal-memo/pages/internal-memo.page.ts`: pembuatan RR/KR dan pembukaan memo berdasarkan
  nomor IM unik.
- `tests/features/internal-memo/pages/memo-workflow.page.ts`: submit, approve/reject, pembayaran, close,
  assertion status, upload, dan validasi response API.
- `tests/fixtures/memo-automation.png`: fixture upload non-rahasia.

## Mengapa strukturnya seperti ini

- Setiap test independen dan membuat memo sendiri; tidak ada test yang bergantung
  pada test sebelumnya.
- Pergantian role memakai BrowserContext terpisah sesuai pola multi-role Playwright.
- Locator memprioritaskan role/nama yang terlihat pengguna dan assertion bersifat
  web-first, sehingga Playwright menunggu UI tanpa timeout buatan.
- Response mutating selalu diperiksa endpoint, HTTP method, dan `response.ok()`.
- Upload menunggu PUT storage selesai sebelum form disubmit.
- Suite dikunci oleh `LEGAL_ALLOW_E2E_WORKFLOW` dan konfigurasi hanya menerima host
  Legal staging.

Referensi resmi yang mendasari struktur ini:

- [Playwright authentication dan multiple roles](https://playwright.dev/docs/auth)
- [Playwright test isolation](https://playwright.dev/docs/browser-contexts)
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright best practices](https://playwright.dev/docs/best-practices)

## Jika flow atau fitur berubah

1. Jika teks/tombol/field berubah, perbarui locator di Page Object, bukan di semua
   test case.
2. Jika endpoint atau status transisi berubah, perbarui `reviewConfigs` dan method
   terkait di `memo-workflow.page.ts`.
3. Jika role penutup berubah menjadi Staff Finance, pindahkan pemanggilan `close()`
   ke callback `staffFinance` pada `payAndCloseMemo`.
4. Jika ada tahap approval baru, tambahkan credential `.env`, mapping role pada
   fixture, method/transisi pada Page Object, lalu sisipkan satu `test.step` pada
   skenario.
5. Jika ada tipe memo baru, tambahkan data creator pada `internal-memo.page.ts` dan
   buat test happy path mandiri.
6. Untuk jalur negatif baru, buat memo baru dalam test tersebut. Jangan memakai ID
   hard-coded atau memo dari test lain.
7. Jalankan satu skenario yang berubah terlebih dahulu, cek HTML report, kemudian
   baru jalankan suite penuh.

Jika test gagal di tengah flow, memo QA akan tetap berada pada status terakhir yang
berhasil. Nomor uniknya terlihat di trace/screenshot/report sehingga dapat ditelusuri
tanpa menyentuh data lain.
