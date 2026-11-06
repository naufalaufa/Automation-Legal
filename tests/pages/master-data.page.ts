import { expect, type Locator, type Page, type Response } from '@playwright/test';

type RecipientData = {
  cityName: string;
  code: string;
  name: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

type InstitutionData = {
  cityName: string;
  type: 'Resmi' | 'Koordinasi';
  code: string;
  name: string;
};

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

  async createInstitution(data: InstitutionData): Promise<Response> {
    await this.openPage('/instansi/', 'Instansi');
    await this.page
      .getByRole('button', { name: 'Tambah Instansi', exact: true })
      .click();

    const dialog = this.page.getByRole('dialog');
    await expect(
      dialog.getByText('Tambah Instansi', { exact: true }),
    ).toBeVisible();

    await dialog.locator('input[name="code"]').fill(data.code);
    await dialog.locator('input[name="name"]').fill(data.name);
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Pilih kota..."]'),
      data.cityName,
    );
    await this.selectOption(
      dialog.locator('[aria-placeholder="Pilih jenis instansi"]'),
      data.type,
    );

    return this.submitAndWait(
      dialog,
      '/api/v1/master/institutions',
      'Simpan',
    );
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
    await this.visibleOptions()
      .filter({ hasText: optionName })
      .first()
      .click();
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

