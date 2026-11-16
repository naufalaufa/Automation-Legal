import { test } from '../../../fixtures/legal.fixture';
import { featureEnabled } from '../../../support/env';
import {
  paymentHistoryBranchCode,
  paymentHistoryRoleAccess,
} from '../data/payment-history.data';
import { createPaymentHistoryDataset } from '../flows/payment-history.flow';
import { PaymentHistoryPage } from '../pages/payment-history.page';
import type { PaymentHistorySurface } from '../types/payment-history.types';

const mutationEnabled = featureEnabled('LEGAL_ALLOW_E2E_WORKFLOW');

test.describe('Legal staging - Payment History E2E @e2e @mutating @payment-history', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_E2E_WORKFLOW=true untuk mengizinkan lima pembayaran staging.',
  );
  test.setTimeout(1_200_000);

  test('[TC-PAYMENT-HISTORY-E2E-001] lima pembayaran RR/KR konsisten pada seluruh surface dan role', async ({
    runAsRole,
  }) => {
    await test.step('Preflight seluruh credential dan role sebelum mutasi', async () => {
      for (const access of paymentHistoryRoleAccess) {
        await test.step(`Validasi akun ${access.label}`, () =>
          runAsRole(access.role, async () => undefined),
        );
      }
    });

    const dataset = await test.step(
      'Buat dan selesaikan tepat lima pembayaran staging',
      () => createPaymentHistoryDataset(runAsRole),
    );

    const rrRecords = dataset.records.filter((record) => record.type === 'RR');
    const krRecords = dataset.records.filter((record) => record.type === 'KR');
    const latestRr = rrRecords.at(-1);
    const latestKr = krRecords.at(-1);
    if (!latestRr || !latestKr) {
      throw new Error('Dataset wajib memiliki memo RR dan KR.');
    }

    for (const access of paymentHistoryRoleAccess) {
      const hasSurface = (surface: PaymentHistorySurface): boolean =>
        (access.surfaces as readonly PaymentHistorySurface[]).includes(surface);

      await test.step(`Validasi riwayat sebagai ${access.label}`, () =>
        runAsRole(access.role, async (page) => {
          const history = new PaymentHistoryPage(page);

          if (hasSurface('internal-memo-dialog')) {
            await test.step('Dialog Internal Memo menampilkan pembayaran terbaru RR', () =>
              history.expectInternalMemoLatest(latestRr, latestRr),
            );
            await test.step('Dialog Internal Memo menampilkan pembayaran terbaru KR', () =>
              history.expectInternalMemoLatest(latestKr, latestKr),
            );
          }

          if (hasSurface('memo-pdf')) {
            await test.step('PDF RR memuat riwayat RR sebelumnya', () =>
              history.expectMemoPdfPreviousRecords(
                latestRr,
                rrRecords.slice(0, -1),
              ),
            );
            await test.step('PDF KR memuat riwayat KR sebelumnya', () =>
              history.expectMemoPdfPreviousRecords(
                latestKr,
                krRecords.slice(0, -1),
              ),
            );
          }

          if (hasSurface('banner')) {
            await test.step('Banner memuat lima pembayaran pada tab RR dan KR', () =>
              history.expectBannerRecords(dataset.records),
            );
          } else {
            await test.step('Role tanpa izin tidak dapat membuka riwayat Banner', () =>
              history.expectBannerHistoryUnavailable(
                paymentHistoryBranchCode,
              ),
            );
          }

          if (hasSurface('recipient')) {
            await test.step('Penerima memuat seluruh pembayaran KR', () =>
              history.expectRecipientRecords(
                dataset.recipientName,
                dataset.records,
              ),
            );
          }
        }),
      );
    }
  });
});
