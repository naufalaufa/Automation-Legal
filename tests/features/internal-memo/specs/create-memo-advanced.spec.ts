import { expect, test } from '@playwright/test';
import { featureEnabled } from '../../../support/env';
import { uniqueReference } from '../../../support/identifiers';
import { MEMO_ATTACHMENT_PATH } from '../../../support/paths';
import { loginAsLegalRole } from '../../auth/support/credentials';
import { InternalMemoPage } from '../pages/internal-memo.page';
import type {
  PaymentMethod,
  RrPaymentData,
} from '../types/memo.types';

const mutationEnabled = featureEnabled('LEGAL_ALLOW_MEMO_CREATE');

async function expectCreatedAndOpen(
  memo: InternalMemoPage,
  imNumber: string,
  response: Awaited<ReturnType<InternalMemoPage['createRrMemo']>>,
): Promise<void> {
  expect(response.ok(), await response.text()).toBeTruthy();
  await memo.expectMemoCreated(imNumber);
  await memo.openMemoByNumber(imNumber);
}

test.describe('Legal staging — advanced Internal Memo creation @mutating', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_MEMO_CREATE=true untuk membuat memo advanced di staging.',
  );
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    await loginAsLegalRole(page, 'adminLegal');
  });

  test('[TC-MEMO-KR-ALL-BRANCHES-001] KR memilih seluruh cabang', async ({
    page,
  }) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueReference('IM ADV/KR-ALL-BRANCHES');
    await memo.goto();

    const response = await test.step(
      'Aktifkan Pilih Semua Cabang dan simpan KR',
      () =>
        memo.createKrMemoWithAllBranches({
          imNumber,
          description:
            'KR automation berlaku untuk seluruh cabang Legal staging.',
          attachmentPath: MEMO_ATTACHMENT_PATH,
          grandTotal: '1000000',
          termInMonth: '1',
        }),
    );

    await expectCreatedAndOpen(memo, imNumber, response);
    await memo.expectBranchCount();
    await expect(
      page.getByText('Berlaku untuk seluruh cabang', { exact: true }).first(),
    ).toBeVisible();
  });

  const paymentMethods: ReadonlyArray<{
    id: string;
    method: PaymentMethod;
  }> = [
    { id: 'TUNAI', method: 'Tunai' },
    { id: 'TRANSFER', method: 'Transfer' },
    { id: 'VA', method: 'VA' },
  ];

  for (const { id, method } of paymentMethods) {
    test(`[TC-MEMO-RR-METHOD-${id}-001] RR dengan pembayaran ${method}`, async ({
      page,
    }) => {
      const memo = new InternalMemoPage(page);
      const imNumber = uniqueReference(`IM ADV/RR-${id}`);
      await memo.goto();

      const response = await test.step(`Simpan RR dengan metode ${method}`, () =>
        memo.createRrMemo({
          imNumber,
          description: `RR automation dengan metode pembayaran ${method}.`,
          attachmentPath: MEMO_ATTACHMENT_PATH,
          termInMonth: '1',
          paymentMethod: method,
          destination: `${method} QA AUTOMATION STAGING`,
          amount: '100000',
        }),
      );

      await expectCreatedAndOpen(memo, imNumber, response);
      await memo.expectBranchCount(1);
      await memo.expectPaymentSummary(method, 1);
    });
  }

  test('[TC-MEMO-RR-20-PAYMENTS-001] RR dengan tepat 20 pembayaran', async ({
    page,
  }) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueReference('IM ADV/RR-20-PAYMENTS');
    const payments: RrPaymentData[] = Array.from(
      { length: 20 },
      (_, index) => ({
        method: 'Tunai',
        destination: `TUNAI QA PAYMENT ${String(index + 1).padStart(2, '0')}`,
        amount: '10000',
      }),
    );
    await memo.goto();

    const response = await test.step(
      'Tambah dan isi tepat 20 pembayaran pada satu cabang RR',
      () =>
        memo.createRrMemoWithPayments({
          imNumber,
          description:
            'RR automation boundary dengan tepat 20 pembayaran.',
          attachmentPath: MEMO_ATTACHMENT_PATH,
          termInMonth: '1',
          payments,
        }),
    );

    await expectCreatedAndOpen(memo, imNumber, response);
    await memo.expectBranchCount(1);
    await memo.expectPaymentSummary('Tunai', 20);
  });

  test('[TC-MEMO-RR-SELECT-ALL-JAKARTA-BRANCHES-001] RR memilih semua cabang yang tersedia di Jakarta Barat', async ({
    page,
  }) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueReference('IM ADV/RR-ALL-JAKBAR');
    await memo.goto();

    const branchNames = await test.step(
      'Pilih seluruh cabang Jakarta Barat pada form RR',
      () =>
        memo.selectAllAvailableRrBranches({
          imNumber,
          description:
            'RR automation mencakup seluruh cabang yang tersedia di Jakarta Barat.',
          attachmentPath: MEMO_ATTACHMENT_PATH,
          termInMonth: '1',
        }),
    );

    expect(branchNames.length).toBeGreaterThan(1);
    expect(new Set(branchNames).size).toBe(branchNames.length);
  });
});
