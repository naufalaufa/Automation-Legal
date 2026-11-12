import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Legal staging — login', () => {
  test('[TC-LOGIN-001] @smoke root mengarah ke halaman login', async ({ page }) => {
    const login = new LoginPage(page);
    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await login.expectLoaded();
  });

  test('[TC-LOGIN-002] @smoke komponen utama login tampil', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.expectLoaded();
    await expect(login.visibleText('Username')).toBeVisible();
    await expect(login.visibleText('Password')).toBeVisible();
    await expect(login.visibleText('v1.0.0')).toBeVisible();
    await expect(login.visibleText('© 2026 Pusat Gadai Indonesia.')).toBeVisible();
  });

  test('[TC-LOGIN-003] @regression field kosong menampilkan validasi wajib isi', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.submitButton.click();

    await expect(login.visibleText('Username harus diisi')).toBeVisible();
    await expect(login.visibleText('Password harus diisi')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('[TC-LOGIN-004] @regression password dapat ditampilkan dan disembunyikan', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.passwordInput.fill('qa-password-sample');

    await expect(login.passwordInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Tampilkan password' }).click();
    await expect(login.passwordInput).toHaveAttribute('type', 'text');
    await expect(login.passwordInput).toHaveValue('qa-password-sample');

    await page.getByRole('button', { name: 'Sembunyikan password' }).click();
    await expect(login.passwordInput).toHaveAttribute('type', 'password');
  });

  test('[TC-LOGIN-005] @negative akun yang tidak terdaftar ditolak', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/auth/login') &&
        response.request().method() === 'POST',
    );

    await login.login(
      'qa_automation_invalid_user',
      'invalid_password_not_a_real_secret',
    );

    const response = await responsePromise;
    expect(response.status()).toBe(400);
    await expect(login.visibleText('User tidak ditemukan')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('[TC-UI-001] @regression tema gelap tersimpan setelah reload', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.darkThemeButton.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(login.darkThemeButton).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('nuxt-color-mode')))
      .toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(login.darkThemeButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('[TC-OBS-001] @smoke halaman login tidak menghasilkan browser error', async ({ page }) => {
    const browserErrors: string[] = [];
    const login = new LoginPage(page);

    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') browserErrors.push(message.text());
    });

    await login.goto();
    await login.expectLoaded();
    expect(browserErrors).toEqual([]);
  });
});

test.describe('Legal staging — responsive', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('[TC-RWD-001] @responsive form login dapat digunakan pada mobile', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.expectLoaded();
    await expect(login.usernameInput).toBeInViewport();
    await expect(login.passwordInput).toBeInViewport();
    await expect(login.submitButton).toBeInViewport();
  });
});
