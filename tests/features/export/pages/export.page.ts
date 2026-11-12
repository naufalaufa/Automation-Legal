import {
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test';
import {
  datedXlsxPattern,
  verifySpreadsheetDownload,
} from '../support/spreadsheet';
import type { ListExportTarget } from '../types/export.types';

export class ExportPage {
  constructor(readonly page: Page) {}

  private exactExportButton(): Locator {
    return this.page.getByRole('button', { name: 'Export', exact: true });
  }

  async gotoList(target: ListExportTarget): Promise<void> {
    await this.page.goto(target.route);

    await expect
      .poll(() => new URL(this.page.url()).pathname)
      .toBe(target.route);
    await expect(
      this.page.getByRole('heading', {
        name: target.pageHeading,
        exact: true,
      }),
    ).toBeVisible();
  }

  async expectListExportPlacement(target: ListExportTarget): Promise<void> {
    await this.gotoList(target);
    const exportButton = this.exactExportButton();

    await expect(exportButton).toHaveCount(1);
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeInViewport();
  }

  async downloadListExport(
    target: ListExportTarget,
    testInfo: TestInfo,
  ): Promise<string> {
    await this.expectListExportPlacement(target);
    await this.exactExportButton().click();

    const dialog = this.page.getByRole('dialog', {
      name: target.dialogHeading,
    });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('heading', {
        name: target.dialogHeading,
        exact: true,
      }),
    ).toBeVisible();

    const downloadPromise = this.page.waitForEvent('download');
    await dialog
      .getByRole('button', { name: 'Export', exact: true })
      .click();
    const download = await downloadPromise;

    return verifySpreadsheetDownload(
      download,
      datedXlsxPattern(target.filePrefix),
      testInfo,
    );
  }

  async expectListExportUnavailable(target: ListExportTarget): Promise<void> {
    await this.page.goto(target.route);

    if (target.id === 'instansi') {
      await expect
        .poll(() => new URL(this.page.url()).pathname)
        .not.toBe(target.route);
    } else {
      await expect(
        this.page.getByRole('heading', {
          name: target.pageHeading,
          exact: true,
        }),
      ).toBeVisible();
    }

    await expect(this.exactExportButton()).toHaveCount(0);
  }

  async gotoBannerPaymentHistory(branchCode: string): Promise<void> {
    await this.page.goto('/banner/');
    await expect(
      this.page.getByRole('heading', { name: 'Banner', exact: true }),
    ).toBeVisible();

    const exactBranchCodeCell = this.page.getByRole('cell', {
      name: branchCode,
      exact: true,
    });
    const branchRow = this.page
      .getByRole('row')
      .filter({ has: exactBranchCodeCell });
    const branchSearch = this.page.getByRole('textbox', {
      name: 'Cari nama atau kode cabang...',
      exact: true,
    });
    await expect(branchSearch).toBeVisible();
    await branchSearch.fill(branchCode);
    await Promise.all([
      this.page.waitForURL(
        (url) => url.searchParams.get('search') === branchCode,
      ),
      branchSearch.press('Enter'),
    ]);
    // Search memicu beberapa update router/API. Tunggu request selesai agar row
    // tidak ter-render ulang tepat saat tombol detail diklik.
    await this.page.waitForLoadState('networkidle');
    await expect(branchRow).toHaveCount(1);
    await expect(branchRow).toBeVisible();

    // Tombol ikon "lihat" belum mempunyai accessible name di aplikasi.
    // Locator tetap dibatasi pada row cabang target agar tidak bergantung pada
    // posisi tombol di seluruh halaman.
    const viewButton = branchRow.getByRole('button').first();
    await Promise.all([
      this.page.waitForURL(/\/banner\/\d+(?:\?.*)?$/),
      viewButton.click(),
    ]);

    const paymentHistoryLink = this.page.getByRole('link', {
      name: 'Riwayat Pembayaran',
      exact: true,
    });
    await expect(paymentHistoryLink).toBeVisible();
    await Promise.all([
      this.page.waitForURL(/\/banner\/\d+\/riwayat-pembayaran/),
      paymentHistoryLink.click(),
    ]);

    await expect(
      this.page.getByRole('heading', { name: branchCode, exact: true }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('heading', {
        name: 'Daftar Pembayaran',
        exact: true,
      }),
    ).toBeVisible();
  }

  async downloadBannerPaymentHistory(
    branchCode: string,
    testInfo: TestInfo,
  ): Promise<string> {
    await this.gotoBannerPaymentHistory(branchCode);

    const exportButton = this.page.getByRole('button', {
      name: 'Export Pembayaran',
      exact: true,
    });
    await expect(exportButton).toHaveCount(1);
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeInViewport();
    await exportButton.click();

    const dialog = this.page.getByRole('dialog', {
      name: 'Export Riwayat Pembayaran',
    });
    await expect(dialog).toBeVisible();

    const downloadPromise = this.page.waitForEvent('download');
    await dialog
      .getByRole('button', { name: 'Export', exact: true })
      .click();
    const download = await downloadPromise;

    return verifySpreadsheetDownload(
      download,
      datedXlsxPattern(
        `riwayat-pembayaran-${branchCode.toLocaleLowerCase('id-ID')}`,
      ),
      testInfo,
    );
  }

  async expectBannerPaymentHistoryUnavailable(): Promise<void> {
    await this.page.goto('/banner/');
    const firstDataRow = this.page.getByRole('row').nth(1);
    await expect(firstDataRow).toBeVisible();
    await expect(this.exactExportButton()).toHaveCount(0);
    await firstDataRow.getByRole('button').first().click();

    await expect
      .poll(() => new URL(this.page.url()).pathname)
      .toBe('/');
  }

}
