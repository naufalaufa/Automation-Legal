import { expect, type Locator, type Page, type Response } from '@playwright/test';
import type {
  KrMemoData,
  MemoType,
  PaymentMethod,
  RrMemoData,
  RrMultiplePaymentsData,
  RrPaymentData,
  SharedMemoData,
} from '../types/memo.types';

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
    return this.createRrMemoWithPayments({
      imNumber: data.imNumber,
      description: data.description,
      attachmentPath: data.attachmentPath,
      termInMonth: data.termInMonth,
      payments: [
        {
          method: data.paymentMethod ?? 'Tunai',
          destination: data.destination,
          amount: data.amount,
        },
      ],
    });
  }

  /** Membuat satu cabang RR dengan maksimal 20 rincian pembayaran. */
  async createRrMemoWithPayments(
    data: RrMultiplePaymentsData,
  ): Promise<Response> {
    if (data.payments.length < 1 || data.payments.length > 20) {
      throw new Error('Jumlah pembayaran RR harus antara 1 sampai 20.');
    }

    const dialog = await this.prepareRrSecondStep(data);
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari cabang..."]').first(),
      'GGP005',
      'GGP005'
    );
    await dialog
      .locator('input[name="memo_details[0].term_in_month"]')
      .fill(data.termInMonth);

    for (const [paymentIndex, payment] of data.payments.entries()) {
      if (paymentIndex > 0) {
        await dialog
          .getByRole('button', { name: 'Tambah pembayaran', exact: true })
          .click();
      }
      await this.fillRrPayment(dialog, 0, paymentIndex, payment);
    }

    await expect(
      dialog.locator('input[name$=".amount"]'),
    ).toHaveCount(data.payments.length);
    return this.submitMemo(dialog, 'Simpan Memo Resmi');
  }

  /** Memilih seluruh cabang Jakarta Barat pada form tanpa menyimpan memo. */
  async selectAllAvailableRrBranches(
    data: SharedMemoData & { termInMonth: string },
  ): Promise<string[]> {
    const dialog = await this.prepareRrSecondStep(data);
    const branchComboboxes = dialog.locator(
      '[aria-placeholder="Cari cabang..."]',
    );
    const firstBranch = branchComboboxes.first();

    await firstBranch.click();
    const options = this.visibleOptions();
    await expect(options.first()).toBeVisible();
    const branchNames = (await options.allTextContents())
      .map((name) => name.trim())
      .filter(Boolean);
    expect(branchNames.length).toBeGreaterThan(1);
    await this.selectVisibleOption(branchNames[0]);

    for (const [branchIndex, branchName] of branchNames.entries()) {
      if (branchIndex > 0) {
        await dialog
          .getByRole('button', { name: 'Tambah cabang', exact: true })
          .click();
        await this.selectSearchOption(
          branchComboboxes.nth(branchIndex),
          branchName,
          branchName,
        );
      }

      await dialog
        .locator(`input[name="memo_details[${branchIndex}].term_in_month"]`)
        .fill(data.termInMonth);
      await expect(
        dialog.getByText(branchName, { exact: true }).first(),
      ).toBeVisible();
    }

    await expect(branchComboboxes).toHaveCount(branchNames.length);
    return branchNames;
  }

  /** Mengisi field khusus KR lalu menyimpan memo sebagai Draft. */
  async createKrMemo(data: KrMemoData): Promise<Response> {
    const dialog = await this.prepareKrSecondStep(data);
    await dialog
      .locator('input[name="term_in_month"]')
      .fill(data.termInMonth);
    await this.selectSearchOption(
      dialog.locator('[aria-placeholder="Cari cabang..."]'),
      'GGP005',
      'GGP005'
    );

    return this.submitMemo(dialog, 'Simpan Memo Koordinasi');
  }

  /** Membuat KR yang berlaku untuk seluruh cabang melalui switch resmi UI. */
  async createKrMemoWithAllBranches(data: KrMemoData): Promise<Response> {
    const dialog = await this.prepareKrSecondStep(data);
    await dialog
      .locator('input[name="term_in_month"]')
      .fill(data.termInMonth);

    const allBranchesSwitch = dialog.getByRole('switch', {
      name: 'Berlaku untuk semua cabang',
    });
    await allBranchesSwitch.click();
    await expect(allBranchesSwitch).toBeChecked();
    await expect(
      dialog.locator('[aria-placeholder="Cari cabang..."]'),
    ).toBeHidden();

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

    await expect(this.page).toHaveURL(
      /\/internal-memo\/\d+\/?(?:\?.*)?$/,
    );
    await expect(
      this.page.getByRole('heading', { name: imNumber, exact: true }),
    ).toBeVisible();

    const match = new URL(this.page.url()).pathname.match(/\/internal-memo\/(\d+)$/);
    if (!match) throw new Error(`ID memo tidak ditemukan dari URL: ${this.page.url()}`);
    return Number(match[1]);
  }

  /** Memastikan jumlah cabang pada halaman detail sesuai hasil form. */
  async expectBranchCount(expected?: number): Promise<number> {
    const summary = this.page
      .getByText(/\d+ cabang terdaftar pada memo ini\./)
      .first();
    await expect(summary).toBeVisible();
    const match = (await summary.innerText()).match(/(\d+) cabang/);
    if (!match) throw new Error('Jumlah cabang tidak ditemukan pada detail memo.');
    const count = Number(match[1]);
    if (expected !== undefined) expect(count).toBe(expected);
    else expect(count).toBeGreaterThan(1);
    return count;
  }

  /** Memastikan metode dan jumlah pembayaran terlihat pada detail memo. */
  async expectPaymentSummary(
    method: PaymentMethod,
    paymentCount: number,
  ): Promise<void> {
    await expect(
      this.page.getByText(`${paymentCount} pembayaran`, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      this.page.getByText(method, { exact: true }).first(),
    ).toBeVisible();
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
    const firstOption = this.visibleOptions().first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
  }

  private async selectVisibleOption(optionName: string): Promise<void> {
    const option = this.page
      .getByRole('option', { name: optionName, exact: true })
      .filter({ visible: true });
    await expect(option).toBeVisible();
    await option.click();
  }

  private async prepareRrSecondStep(data: SharedMemoData): Promise<Locator> {
    const dialog = await this.openCreateForm('RR');
    await this.fillSharedInformation(dialog, data);
    await this.goToSecondStep(dialog);
    return dialog;
  }

  private async prepareKrSecondStep(data: KrMemoData): Promise<Locator> {
    const dialog = await this.openCreateForm('KR');

    // Penerima dan rekening baru tersedia setelah kota dipilih.
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

    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Pilih kota terlebih dahulu"]'),
    );
    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Cari penerima..."]'),
    );
    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Pilih rekening..."]'),
    );
    await dialog.locator('input[name="grand_total"]').fill(data.grandTotal);
    await this.uploadAndWaitUntilFinished(dialog, data.attachmentPath);
    await this.goToSecondStep(dialog);
    return dialog;
  }

  private async fillRrPayment(
    dialog: Locator,
    branchIndex: number,
    paymentIndex: number,
    payment: RrPaymentData,
  ): Promise<void> {
    const paymentOffset = paymentIndex;
    await this.selectFirstAvailableOption(
      dialog.locator('[aria-placeholder="Cari banner..."]').nth(paymentOffset),
    );

    const method = dialog
      .locator('[aria-placeholder="Pilih jenis..."]')
      .nth(paymentOffset);
    if (!(await method.getByText(payment.method, { exact: true }).count())) {
      await method.click();
      await this.selectVisibleOption(payment.method);
    }
    await expect(method).toContainText(payment.method);

    await dialog
      .locator(
        `input[name="memo_details[${branchIndex}].payments[${paymentIndex}].destination"]`,
      )
      .fill(payment.destination);
    await dialog
      .locator(
        `input[name="memo_details[${branchIndex}].payments[${paymentIndex}].amount"]`,
      )
      .fill(payment.amount);
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
