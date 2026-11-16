import { expect, test } from '@playwright/test';
import { loginRoles } from '../data/roles.data';
import { LoginPage } from '../pages/login.page';
import { credentialsFor } from '../support/credentials';

// Login test harus selalu dimulai tanpa cookie/localStorage dari sesi sebelumnya.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login berhasil untuk seluruh role Legal', () => {
  // Dokumentasi Playwright merekomendasikan parameterization untuk menjalankan
  // skenario yang sama dengan beberapa set data. Loop ini menghasilkan 6 test
  // independen, satu test untuk setiap role termasuk Audit.
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
        await loginPage.loginExpectingRole(
          username,
          password,
          role.expectedRole,
        );

        // Helper login sudah menunggu URL dan sidebar Dashboard benar-benar siap.
      });

      await test.step('Verifikasi dashboard dan identitas akun', async () => {
        // Web-first assertions akan retry sampai UI dashboard benar-benar siap.
        await expect(page).toHaveTitle('LeMS - Dashboard', {
          timeout: 30_000,
        });
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
