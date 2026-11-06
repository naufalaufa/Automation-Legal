# Automation pembuatan Internal Memo

File test: `tests/create-memo.spec.ts`

Test ini bersifat **mutating**: setiap eksekusi membuat satu memo Draft baru di
environment staging. Test sengaja tidak dimasukkan ke perintah `npm test` agar
tidak ikut berjalan bersama regression login.

## Menjalankan dari VS Code

1. Buka `tests/create-memo.spec.ts`.
2. Klik tombol Play di sebelah test RR untuk membuat satu Memo Resmi.
3. Klik tombol Play di sebelah test KR untuk membuat satu Memo Koordinasi.

Nomor IM dibuat unik dari tipe memo dan timestamp, sehingga test dapat dijalankan
berulang tanpa bentrok nomor dengan hasil run sebelumnya.

## Menjalankan dari terminal

```powershell
npm.cmd run test:create-memo:rr
npm.cmd run test:create-memo:kr
```

Untuk menjalankan keduanya:

```powershell
npm.cmd run test:create-memo
```

## Pengaman staging

- `LEGAL_BASE_URL` tetap dibatasi ke host staging oleh `playwright.config.ts`.
- `LEGAL_ALLOW_MEMO_CREATE=true` harus tersedia di `.env`.
- Test diberi tag `@mutating` dan tidak masuk suite default.
- Test menggunakan role Admin Legal untuk membuat memo.
- Data master dipilih dari opsi UI yang tersedia; tidak ada ID database yang
  ditulis langsung di test.
- Memo hasil automation tidak dihapus otomatis agar tidak ada operasi delete
  tersembunyi. Hasil run akan tetap berada sebagai data Draft di staging.

## Struktur kode

- `tests/create-memo.spec.ts`: dua skenario bisnis yang muncul sebagai dua tombol
  Play terpisah.
- `tests/pages/internal-memo.page.ts`: locator dan langkah interaksi RR/KR.
- `tests/fixtures/memo-automation.png`: lampiran kecil yang memang dikhususkan
  untuk automation staging.
