import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object untuk halaman login.
 *
 * Selector dan aksi login disimpan di satu tempat supaya perubahan UI login
 * tidak memaksa kita mengubah seluruh file test.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly darkThemeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Role locator diprioritaskan karena merepresentasikan cara pengguna
    // dan assistive technology mengenali elemen di halaman.
    this.usernameInput = page.getByRole('textbox', {
      name: 'Ketik username anda',
    });
    this.passwordInput = page.getByRole('textbox', {
      name: 'Masukkan password',
    });
    this.submitButton = page.getByRole('button', {
      name: 'Masuk',
      exact: true,
    });
    this.darkThemeButton = page.getByRole('button', { name: 'Mode gelap' });
  }

  /** Membuka halaman login relatif terhadap baseURL di Playwright config. */
  async goto(): Promise<void> {
    await this.page.goto('/login');

    // Web-first assertions otomatis menunggu sampai UI siap digunakan.
    await expect(this.page).toHaveTitle('LeMS - Masuk');
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /** Mengisi credential lalu mengirim form seperti pengguna sebenarnya. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Helper untuk assertion teks yang memang terlihat oleh pengguna. */
  visibleText(text: string): Locator {
    return this.page.getByText(text, { exact: true }).filter({ visible: true });
  }

  /** Kompatibilitas dengan validation test yang sudah ada. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login$/);
    await expect(this.page).toHaveTitle('LeMS - Masuk');
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
