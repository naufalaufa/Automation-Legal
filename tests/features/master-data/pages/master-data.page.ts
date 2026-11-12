import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type {
  InstitutionData,
  InstitutionResult,
  RecipientData,
} from '../types/master-data.types';

/**
 * Page Object untuk master data Penerima dan Instansi.
 *
 * Test memakai interaksi UI seperti pengguna dan menunggu response create yang
 * spesifik, sehingga hasil PASS berarti backend juga menerima data tersebut.
 */
export class MasterDataPage {
  constructor(readonly page: Page) {}

  async createRecipient(data: RecipientData): Promise<Response> {
    await this.openPage('/penerima/', 'Penerima');
    await this.page.getByRole('button', { name: 'Tambah', exact: true }).click();

    const dialog = this.page.getByRole('dialog');
    await expect(
      dialog.getByText('Tambah Penerima', { exact: true }),
    ).toBeVisible();

    await dialog.locator('input[name="code"]').fill(data.code);
    await dialog.locator('input[name="name"]').fill(data.name);
    await dialog
      .locator('input[name="phone_number"]')
      .fill(data.phoneNumber);
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Pilih kota..."]'),
      data.cityName,
    );

    await dialog.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await expect(dialog.getByText('Step 2 of 2', { exact: true })).toBeVisible();

    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari nama bank..."]'),
      data.bankName,
    );
    await dialog
      .locator('input[name="accounts[0].account_number"]')
      .fill(data.accountNumber);
    await dialog
      .locator('input[name="accounts[0].account_name"]')
      .fill(data.accountName);

    const activeAccount = dialog.getByRole('switch', {
      name: 'Jadikan rekening 1 sebagai rekening aktif',
    });
    await activeAccount.click();
    await expect(activeAccount).toHaveAttribute('aria-checked', 'true');

    return this.submitAndWait(
      dialog,
      '/api/v1/master/recipients',
      'Simpan',
    );
  }

  async createInstitution(data: InstitutionData): Promise<InstitutionResult> {
    await this.openPage('/instansi/', 'Instansi');

    // Form terbaru tidak lagi menerima kode/nama bebas. Nama dibentuk backend
    // dari master kode instansi dan kota, sehingga command dibuat idempotent.
    const institutionName = `${data.institutionCode} ${data.cityName}`;
    if (await this.institutionExists(institutionName, data.type)) {
      return { created: false, name: institutionName };
    }

    await this.page
      .getByRole('button', { name: 'Tambah Instansi', exact: true })
      .click();

    const dialog = this.page.getByRole('dialog');
    await expect(
      dialog.getByText('Tambah Instansi', { exact: true }),
    ).toBeVisible();

    await this.selectOption(
      dialog.locator('[aria-placeholder="Pilih jenis instansi"]'),
      data.type,
    );
    await this.selectOption(
      dialog.getByRole('combobox', { name: 'Kode Instansi *' }),
      data.institutionCode,
    );
    await this.selectOption(
      dialog.getByRole('combobox', { name: 'Kota *' }),
      data.cityName,
    );

    const response = await this.submitAndWait(
      dialog,
      '/api/v1/master/institutions',
      'Simpan',
    );
    return { created: true, name: institutionName, response };
  }

  async expectCreated(name: string): Promise<void> {
    await expect(this.page.getByRole('dialog')).toBeHidden();
    const searchInput = this.page
      .getByPlaceholder(/Cari nama atau kode/i)
      .first();
    await searchInput.fill(name);
    await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible();
  }

  private async openPage(path: string, heading: string): Promise<void> {
    await this.page.goto(path);
    const pathWithoutTrailingSlash = path.replace(/\/$/, '');
    await expect(this.page).toHaveURL(
      new RegExp(`${pathWithoutTrailingSlash}/?(?:\\?.*)?$`),
    );
    await expect(
      this.page.getByRole('heading', { name: heading, exact: true }),
    ).toBeVisible();
  }

  private visibleOptions(): Locator {
    return this.page.getByRole('option').filter({ visible: true });
  }

  private async selectSearchOption(
    combobox: Locator,
    optionName: string,
  ): Promise<void> {
    await combobox.fill(optionName);
    await this.visibleOptions()
      .filter({ hasText: optionName })
      .first()
      .click();
  }

  private async selectOption(
    combobox: Locator,
    optionName: string,
  ): Promise<void> {
    await combobox.click();
    const option = this.page
      .getByRole('option', { name: optionName, exact: true })
      .filter({ visible: true });
    await expect(option).toBeVisible();
    await option.click();
  }

  private async institutionExists(
    name: string,
    type: InstitutionData['type'],
  ): Promise<boolean> {
    const searchInput = this.page
      .getByPlaceholder(/Cari nama atau kode instansi/i)
      .first();
    const searchResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('/api/v1/master/institutions'),
    );
    await searchInput.fill(name);
    await searchResponse;

    const existing = this.page
      .getByRole('row')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .filter({ hasText: type })
      .first();
    try {
      await existing.waitFor({ state: 'visible', timeout: 3_000 });
      return true;
    } catch {
      // Tidak ditemukan setelah respons pencarian selesai: lanjut membuat.
    }

    const resetResponse = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        response.url().includes('/api/v1/master/institutions'),
    );
    await searchInput.fill('');
    await resetResponse;
    return false;
  }

  private async submitAndWait(
    dialog: Locator,
    endpoint: string,
    buttonName: string,
  ): Promise<Response> {
    const createResponse = this.page.waitForResponse(
      (response) =>
        response.url().endsWith(endpoint) &&
        response.request().method() === 'POST',
    );
    await dialog
      .getByRole('button', { name: buttonName, exact: true })
      .click();
    return createResponse;
  }
}

