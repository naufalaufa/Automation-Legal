import { expect, type Locator, type Page, type Response } from '@playwright/test';

export type MemoType = 'RR' | 'KR';

type SharedMemoData = {
  imNumber: string;
  description: string;
  attachmentPath: string;
};

type KrMemoData = SharedMemoData & {
  grandTotal: string;
  termInMonth: string;
};

type RrMemoData = SharedMemoData & {
  termInMonth: string;
  destination: string;
  amount: string;
};

/**
 * Page Object untuk alur pembuatan Internal Memo.
 *
 * Locator dan aksi UI disimpan di sini agar file spec hanya menjelaskan
 * skenario bisnis RR/KR. Jika tampilan berubah, perbaikannya cukup dilakukan
 * di satu tempat.
 */
export class InternalMemoPage {
  readonly page: Page;
  readonly addMemoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addMemoButton = page.getByRole('button', {
      name: 'Tambah Internal Memo',
    });
  }

  /** Membuka daftar Internal Memo setelah pengguna berhasil login. */
  async goto(): Promise<void> {
    await this.page.goto('/internal-memo/');
    await expect(this.page).toHaveURL(/\/internal-memo\//);
    await expect(this.addMemoButton).toBeVisible();
  }

  /** Membuka wizard sesuai tipe memo dan mengembalikan dialog aktif. */
  async openCreateForm(type: MemoType): Promise<Locator> {
    await this.addMemoButton.click();
    await this.page
      .getByRole('menuitem', {
        name: type === 'RR' ? /Memo Resmi \(RR\)/ : /Memo Koordinasi \(KR\)/,
      })
      .click();

    const dialog = this.page.getByRole('dialog');
    await expect(
      dialog.getByText(
        type === 'RR' ? 'Buat Memo Resmi (RR)' : 'Buat Memo Koordinasi (KR)',
        { exact: true },
      ),
    ).toBeVisible();
    return dialog;
  }

  /**
   * Mengisi field yang dipakai RR maupun KR.
   * Data master dipilih melalui teks yang terlihat pengguna, bukan CSS class.
   */
  async fillSharedInformation(
    dialog: Locator,
    data: SharedMemoData,
  ): Promise<void> {
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari pengguna..."]'),
      'Siti Masitoh',
    );
    await dialog.locator('input[name="im_number"]').fill(data.imNumber);
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari kota..."]'),
      'Kota Jakarta Barat',
      'Kota Jakarta Barat',
    );
    await dialog.locator('textarea[name="description"]').fill(data.description);

    // Pilih satu instansi valid yang tersedia untuk kota dan tipe memo tersebut.
    const institution = dialog.locator(
      '[aria-placeholder="Pilih kota terlebih dahulu"]',
    );
    await institution.click();
    await this.visibleOptions().first().click();

    await this.uploadAndWaitUntilFinished(dialog, data.attachmentPath);
  }

  /** Mengisi field khusus RR lalu menyimpan memo sebagai Draft. */
  async createRrMemo(data: RrMemoData): Promise<Response> {
    const dialog = await this.openCreateForm('RR');
    await this.fillSharedInformation(dialog, data);
    await this.goToSecondStep(dialog);

    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Cari cabang..."]'),
    );
    await dialog
      .locator('input[name="memo_details[0].term_in_month"]')
      .fill(data.termInMonth);
    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Cari banner..."]'),
    );
    await expect(
      dialog.locator('[aria-placeholder="Pilih jenis..."]'),
    ).toContainText('Tunai');
    await dialog
      .locator('input[name="memo_details[0].payments[0].destination"]')
      .fill(data.destination);
    await dialog
      .locator('input[name="memo_details[0].payments[0].amount"]')
      .fill(data.amount);

    return this.submitMemo(dialog, 'Simpan Memo Resmi');
  }

  /** Mengisi field khusus KR lalu menyimpan memo sebagai Draft. */
  async createKrMemo(data: KrMemoData): Promise<Response> {
    const dialog = await this.openCreateForm('KR');

    // Penerima dan rekening baru tersedia setelah kota dipilih, sehingga field
    // bersama diisi lebih dulu kecuali attachment yang tetap ditangani helper.
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari pengguna..."]'),
      'Siti Masitoh',
    );
    await dialog.locator('input[name="im_number"]').fill(data.imNumber);
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari kota..."]'),
      'Kota Jakarta Barat',
      'Kota Jakarta Barat',
    );
    await dialog.locator('textarea[name="description"]').fill(data.description);

    const institution = dialog.locator(
      '[aria-placeholder="Pilih kota terlebih dahulu"]',
    );
    await institution.click();
    await this.visibleOptions().first().click();

    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Cari penerima..."]'),
    );
    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Pilih rekening..."]'),
    );
    await dialog.locator('input[name="grand_total"]').fill(data.grandTotal);
    await this.uploadAndWaitUntilFinished(dialog, data.attachmentPath);
    await this.goToSecondStep(dialog);

    await dialog
      .locator('input[name="term_in_month"]')
      .fill(data.termInMonth);
    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Cari cabang..."]'),
    );

    return this.submitMemo(dialog, 'Simpan Memo Koordinasi');
  }

  /** Memastikan memo hasil submit tampil kembali pada daftar. */
  async expectMemoCreated(imNumber: string): Promise<void> {
    await expect(this.page.getByRole('dialog')).toBeHidden();
    await expect(this.page.getByText(imNumber, { exact: true }).first()).toBeVisible();
  }

  /**
   * Membuka detail memo lewat baris yang memuat nomor IM unik.
   * Aplikasi belum memberi accessible name pada tombol ikon "lihat", sehingga
   * tombol pertama dibatasi ke baris memo yang tepat sebelum diklik.
   */
  async openMemoByNumber(imNumber: string): Promise<number> {
    const row = this.page.getByRole('row').filter({ hasText: imNumber });
    await expect(row).toHaveCount(1);
    await row.getByRole('button').first().click();

    await expect(this.page).toHaveURL(/\/internal-memo\/\d+$/);
    await expect(
      this.page.getByRole('heading', { name: imNumber, exact: true }),
    ).toBeVisible();

    const match = new URL(this.page.url()).pathname.match(/\/internal-memo\/(\d+)$/);
    if (!match) throw new Error(`ID memo tidak ditemukan dari URL: ${this.page.url()}`);
    return Number(match[1]);
  }

  private visibleOptions(): Locator {
    return this.page.getByRole('option').filter({ visible: true });
  }

  private async selectSearchOption(
    combobox: Locator,
    optionName: string,
    searchText?: string,
  ): Promise<void> {
    if (searchText) await combobox.fill(searchText);
    else await combobox.click();
    await this.visibleOptions()
      .filter({ hasText: optionName })
      .first()
      .click();
  }

  private async selectFirstAvailableOption(combobox: Locator): Promise<void> {
    await combobox.click();
    await this.visibleOptions().first().click();
  }

  /**
   * Upload berjalan asynchronous. Menunggu PUT sukses mencegah tombol Lanjut
   * ditekan ketika URL lampiran belum masuk ke state form.
   */
  private async uploadAndWaitUntilFinished(
    dialog: Locator,
    attachmentPath: string,
  ): Promise<void> {
    const uploadFinished = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes('amazonaws.com') &&
        response.ok(),
    );
    await dialog.locator('input[type="file"]').setInputFiles(attachmentPath);
    await uploadFinished;
    await expect(dialog.getByText('memo-automation.png', { exact: true })).toBeVisible();
  }

  private async goToSecondStep(dialog: Locator): Promise<void> {
    await dialog.getByRole('button', { name: 'Lanjut', exact: true }).click();
    await expect(dialog.getByText('Step 2 of 2', { exact: true })).toBeVisible();
  }

  private async submitMemo(
    dialog: Locator,
    buttonName: 'Simpan Memo Resmi' | 'Simpan Memo Koordinasi',
  ): Promise<Response> {
    const createResponse = this.page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/v1/master/memo') &&
        response.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: buttonName, exact: true }).click();
    return createResponse;
  }
}
