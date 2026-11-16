import {
  expect,
  type Page,
} from '@playwright/test';
import pdfParse = require('pdf-parse');
import { ExportPage } from '../../export/pages/export.page';
import type {
  PaymentHistoryRecord,
} from '../types/payment-history.types';

function rupiah(amount: string): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Number(amount))}`;
}

/** Page Object untuk empat representasi riwayat pembayaran Legal. */
export class PaymentHistoryPage {
  constructor(private readonly page: Page) {}

  async expectInternalMemoLatest(
    referenceMemo: PaymentHistoryRecord,
    latestMemo: PaymentHistoryRecord,
  ): Promise<void> {
    await this.gotoMemo(referenceMemo);
    await this.page
      .getByRole('button', { name: 'Pembayaran Terakhir', exact: true })
      .click();

    const dialog = this.page
      .getByRole('dialog')
      .filter({ hasText: 'Pembayaran terakhir per cabang' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Pembayaran terakhir per cabang', { exact: true }),
    ).toBeVisible();

    if (referenceMemo.type === 'RR') {
      await expect(
        dialog.getByRole('columnheader', { name: 'Banner', exact: true }),
      ).toBeVisible();
    } else {
      await expect(
        dialog.getByRole('columnheader', { name: 'Banner', exact: true }),
      ).toHaveCount(0);
    }

    const row = dialog
      .getByRole('row')
      .filter({ hasText: latestMemo.imNumber })
      .filter({ hasText: latestMemo.branchCode });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText(rupiah(latestMemo.amount));

    await dialog.getByRole('button', { name: 'Tutup', exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  async expectMemoPdfPreviousRecords(
    memo: PaymentHistoryRecord,
    expectedPrevious: readonly PaymentHistoryRecord[],
  ): Promise<void> {
    const pdfText = await this.readMemoPdfText(memo);
    const normalized = pdfText.replace(/\s+/g, ' ').trim();
    expect(normalized).toContain('Riwayat pembayaran sebelumnya');

    const section = normalized
      .split('Riwayat pembayaran sebelumnya')[1]
      ?.replace(/[.\s]/g, '');
    expect(section, 'Bagian history pembayaran PDF tidak dapat dibaca.').toBeTruthy();

    for (const previous of expectedPrevious) {
      expect(section).toContain(previous.branchCode);
      expect(section).toContain(previous.amount);
    }
  }

  async expectBannerRecords(
    records: readonly PaymentHistoryRecord[],
  ): Promise<void> {
    const [first] = records;
    if (!first) throw new Error('Dataset Banner tidak boleh kosong.');

    await new ExportPage(this.page).gotoBannerPaymentHistory(first.branchCode);

    for (const type of ['RR', 'KR'] as const) {
      const recordsForType = records.filter((record) => record.type === type);
      if (!recordsForType.length) continue;

      const tabLabel = type === 'RR' ? 'Resmi (RR)' : 'Koordinasi (KR)';
      await this.page.getByText(tabLabel, { exact: true }).click();

      for (const record of recordsForType) {
        const row = this.paymentTable()
          .getByRole('row')
          .filter({ hasText: record.imNumber });
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(rupiah(record.amount));
      }
    }
  }

  async expectRecipientRecords(
    recipientName: string,
    records: readonly PaymentHistoryRecord[],
  ): Promise<void> {
    const krRecords = records.filter((record) => record.type === 'KR');
    if (!krRecords.length) throw new Error('Dataset Penerima memerlukan memo KR.');

    await this.gotoRecipientPaymentHistory(recipientName);
    for (const record of krRecords) {
      const row = this.paymentTable()
        .getByRole('row')
        .filter({ hasText: record.imNumber });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(rupiah(record.amount));
    }
  }

  async expectBannerHistoryUnavailable(branchCode: string): Promise<void> {
    await new ExportPage(this.page).expectBannerPaymentHistoryUnavailable(
      branchCode,
    );
  }

  private async gotoMemo(memo: PaymentHistoryRecord): Promise<void> {
    await this.page.goto(`/internal-memo/${memo.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(this.page).toHaveURL(
      new RegExp(`/internal-memo/${memo.id}/?(?:\\?.*)?$`),
      { timeout: 30_000 },
    );
    await expect(
      this.page.getByRole('heading', { name: memo.imNumber, exact: true }),
    ).toBeVisible({ timeout: 30_000 });
  }

  private async readMemoPdfText(
    memo: PaymentHistoryRecord,
  ): Promise<string> {
    await this.gotoMemo(memo);
    const context = this.page.context();
    const existingPages = new Set(context.pages());
    const pdfBody = this.waitForPdfBody();

    await this.page.getByText('Lihat PDF', { exact: true }).first().click();
    const body = await pdfBody;
    const parsed = await pdfParse(body);

    // Tombol PDF membuka tab baru di Chrome. Tutup tab tersebut supaya satu
    // validasi role tidak meninggalkan banyak viewer terbuka.
    for (const openedPage of context.pages()) {
      if (!existingPages.has(openedPage) && !openedPage.isClosed()) {
        await openedPage.close();
      }
    }

    return parsed.text;
  }

  private waitForPdfBody(timeoutMs = 30_000): Promise<Buffer> {
    const context = this.page.context();

    return new Promise<Buffer>((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        settled = true;
        context.off('response', onResponse);
        reject(
          new Error(
            'Respons application/pdf dengan body tidak diterima dalam 30 detik.',
          ),
        );
      }, timeoutMs);

      const onResponse = (response: import('@playwright/test').Response): void => {
        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.toLowerCase().includes('application/pdf')) return;

        void response
          .body()
          .then((body) => {
            // Endpoint API pertama dapat dilaporkan sebagai application/pdf
            // dengan body kosong. Chrome PDF viewer kemudian meminta body PDF
            // yang sebenarnya; hanya buffer non-kosong yang valid untuk parser.
            if (settled || body.length === 0) return;
            settled = true;
            clearTimeout(timer);
            context.off('response', onResponse);
            resolve(body);
          })
          .catch(() => {
            // Abaikan response PDF yang body-nya tidak dapat dibaca dan tunggu
            // kandidat berikutnya sampai timeout terkontrol di atas.
          });
      };

      context.on('response', onResponse);
    });
  }

  private async gotoRecipientPaymentHistory(
    recipientName: string,
  ): Promise<void> {
    await this.page.goto('/penerima/');
    await expect(
      this.page.getByRole('heading', { name: 'Penerima', exact: true }),
    ).toBeVisible();

    const search = this.page.getByPlaceholder(/Cari nama atau kode/i).first();
    await search.fill(recipientName);
    await Promise.all([
      this.page.waitForURL(
        (url) => url.searchParams.get('search') === recipientName,
      ),
      search.press('Enter'),
    ]);
    await this.page.waitForLoadState('networkidle');

    const row = this.page
      .getByRole('row')
      .filter({ hasText: recipientName });
    await expect(row).toHaveCount(1);
    await Promise.all([
      this.page.waitForURL(/\/penerima\/\d+\/?(?:\?.*)?$/),
      row.getByRole('button').first().click(),
    ]);

    const historyLink = this.page.getByRole('link', {
      name: 'Riwayat Pembayaran',
      exact: true,
    });
    await expect(historyLink).toBeVisible();
    await historyLink.click();
    await expect(this.page).toHaveURL(
      /\/penerima\/\d+\/riwayat-pembayaran\/?(?:\?.*)?$/,
    );
    await expect(
      this.page.getByRole('heading', { name: recipientName, exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  }

  private paymentTable() {
    return this.page
      .getByRole('table')
      .filter({
        has: this.page.getByRole('columnheader', {
          name: 'Nomor IM',
          exact: true,
        }),
      })
      .first();
  }
}
