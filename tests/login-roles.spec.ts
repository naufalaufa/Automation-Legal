import { expect, test } from '@playwright/test';
import { credentialsFor, loginRoles } from './data/login-roles';
import { LoginPage } from './pages/login.page';

// Login test harus selalu dimulai tanpa cookie/localStorage dari sesi sebelumnya.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login berhasil untuk seluruh role Legal', () => {
  // Dokumentasi Playwright merekomendasikan parameterization untuk menjalankan
  // skenario yang sama dengan beberapa set data. Loop ini menghasilkan 6 test
  // independen, satu test untuk setiap role.
  loginRoles.forEach((role, index) => {
    const caseNumber = String(index + 1).padStart(3, '0');

    test(`[TC-ROLE-LOGIN-${caseNumber}] @auth ${role.label} berhasil login`, async ({
      page,
    }) => {
      const loginPage = new LoginPage(page);
      const { username, password } = credentialsFor(role);

      await test.step('Buka halaman login', async () => {
        await loginPage.goto();
      });

      await test.step(`Login sebagai ${role.label}`, async () => {
        await loginPage.login(username, password);

        // Menunggu URL final memastikan redirect dan penyimpanan cookie login
        // sudah selesai sebelum dashboard diverifikasi.
        await page.waitForURL((url) => url.pathname === '/', {
          timeout: 15_000,
        });
      });

      await test.step('Verifikasi dashboard dan identitas akun', async () => {
        // Web-first assertions akan retry sampai UI dashboard benar-benar siap.
        await expect(page).toHaveTitle('LeMS - Dashboard');
        await expect(
          page.getByRole('link', { name: 'Dashboard', exact: true }),
        ).toBeVisible();
        await expect(page.getByText(username, { exact: true })).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Keluar', exact: true }),
        ).toBeVisible();
      });
    });
  });
});
