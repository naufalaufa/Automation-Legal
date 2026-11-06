# Automation Penerima dan Instansi

Automation ini membuat **satu record master baru per command** di Legal staging.
Data tidak dihapus otomatis dan tidak ikut dijalankan oleh `npm test` default.

## Penerima

Setiap Penerima dibuat dengan satu rekening BANK BCA yang berstatus aktif.

| Wilayah | Command |
| --- | --- |
| Kepulauan Seribu | `npm.cmd run create:penerima:kepser` |
| Jakarta Selatan | `npm.cmd run create:penerima:jaksel` |
| Jakarta Timur | `npm.cmd run create:penerima:jaktim` |
| Jakarta Pusat | `npm.cmd run create:penerima:jakpus` |
| Jakarta Barat | `npm.cmd run create:penerima:jakbar` |
| Jakarta Utara | `npm.cmd run create:penerima:jakut` |

## Instansi Resmi (RR)

| Wilayah | Command |
| --- | --- |
| Kepulauan Seribu | `npm.cmd run create:instansi:rr:kepser` |
| Jakarta Selatan | `npm.cmd run create:instansi:rr:jaksel` |
| Jakarta Timur | `npm.cmd run create:instansi:rr:jaktim` |
| Jakarta Pusat | `npm.cmd run create:instansi:rr:jakpus` |
| Jakarta Barat | `npm.cmd run create:instansi:rr:jakbar` |
| Jakarta Utara | `npm.cmd run create:instansi:rr:jakut` |

## Instansi Koordinasi (KR)

| Wilayah | Command |
| --- | --- |
| Kepulauan Seribu | `npm.cmd run create:instansi:kr:kepser` |
| Jakarta Selatan | `npm.cmd run create:instansi:kr:jaksel` |
| Jakarta Timur | `npm.cmd run create:instansi:kr:jaktim` |
| Jakarta Pusat | `npm.cmd run create:instansi:kr:jakpus` |
| Jakarta Barat | `npm.cmd run create:instansi:kr:jakbar` |
| Jakarta Utara | `npm.cmd run create:instansi:kr:jakut` |

## Tombol Play VS Code

Buka panel **Testing / Playwright** di VS Code. Setiap kombinasi entity, kota,
dan tipe tampil sebagai test terpisah dan dapat dijalankan satu per satu. Karena
test dibuat secara data-driven, panel Testing adalah cara paling jelas untuk
memilih tombol Play per kota; command npm di atas memberikan hasil yang sama.

## Pengaman

- Hanya host staging yang diizinkan oleh `playwright.config.ts`.
- `LEGAL_ALLOW_MASTER_DATA_CREATE=true` harus aktif di `.env`.
- Test memakai Superadmin karena role Admin Legal tidak memiliki permission
  membuat master data ini.
- Kode, nama, telepon, dan rekening dibuat unik menggunakan timestamp.
- Setiap test memiliki browser context baru dan tidak bergantung pada test lain.
- Test menunggu response POST create dan memastikan record tampil di daftar.
- Tidak ada operasi edit, delete, atau status toggle tersembunyi.

## Dasar implementasi Playwright

- [Best Practices](https://playwright.dev/docs/best-practices)
- [Parameterized Tests](https://playwright.dev/docs/test-parameterize)
- [Test Isolation](https://playwright.dev/docs/browser-contexts)
- [Command Line dan grep](https://playwright.dev/docs/test-cli)
