import {
  expect,
  type Locator,
  type Page,
  type Response,
} from '@playwright/test';
import type { LoginApiBody } from '../types/auth.types';

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
    await expect(this.page).toHaveTitle(
      /^(?:LeMS - Masuk|Legal Management System)$/,
    );
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /** Mengisi credential lalu mengirim form seperti pengguna sebenarnya. */
  async login(username: string, password: string): Promise<Response> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    const loginResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith('/api/v1/auth/login'),
    );
    await this.submitButton.click();
    return loginResponse;
  }

  /** Login positif dengan error backend yang langsung dapat ditindaklanjuti. */
  async loginExpectingSuccess(
    username: string,
    password: string,
  ): Promise<Response> {
    const response = await this.login(username, password);
    if (response.ok()) return response;

    let message = response.statusText() || 'respons login tidak berhasil';
    let errorCode = 'unknown';
    try {
      const body = (await response.json()) as LoginApiBody;
      message = body.message ?? message;
      errorCode = body.error_code ?? errorCode;
    } catch {
      // Respons non-JSON tetap dilaporkan dengan status HTTP.
    }

    throw new Error(
      `Login staging gagal (${response.status()}, ${errorCode}): ${message}`,
    );
  }

  /** Memastikan credential tidak hanya valid, tetapi juga memegang role target. */
  async loginExpectingRole(
    username: string,
    password: string,
    expectedRole: string,
  ): Promise<Response> {
    const response = await this.loginExpectingSuccess(username, password);
    const body = (await response.json()) as LoginApiBody;
    const actualRole = body.data?.user?.role?.name ?? null;

    if (actualRole !== expectedRole) {
      throw new Error(
        `Role akun staging tidak sesuai: diharapkan ${expectedRole}, diterima ${actualRole ?? 'tanpa role'}.`,
      );
    }
    return response;
  }

  /** Helper untuk assertion teks yang memang terlihat oleh pengguna. */
  visibleText(text: string): Locator {
    return this.page.getByText(text, { exact: true }).filter({ visible: true });
  }

  /** Kompatibilitas dengan validation test yang sudah ada. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login$/);
    await expect(this.page).toHaveTitle(
      /^(?:LeMS - Masuk|Legal Management System)$/,
    );
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
