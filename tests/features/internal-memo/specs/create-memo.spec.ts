import { expect, test } from '@playwright/test';
import { featureEnabled } from '../../../support/env';
import { uniqueReference } from '../../../support/identifiers';
import { MEMO_ATTACHMENT_PATH } from '../../../support/paths';
import { loginAsLegalRole } from '../../auth/support/credentials';
import { InternalMemoPage } from '../pages/internal-memo.page';

const mutationEnabled = featureEnabled('LEGAL_ALLOW_MEMO_CREATE');

test.describe('Legal staging — create Internal Memo @mutating', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_MEMO_CREATE=true untuk mengizinkan pembuatan data staging.',
  );
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await loginAsLegalRole(page, 'adminLegal');
  });

  test('[TC-MEMO-RR-001] @mutating membuat Memo Resmi (RR) valid', async ({
    page,
  }) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueReference('IM AUTO/RR', { random: false });

    await test.step('Buka daftar Internal Memo', async () => {
      await memo.goto();
    });

    const response = await test.step('Isi dan simpan Memo Resmi', async () =>
      memo.createRrMemo({
        imNumber,
        description: 'Memo Description Testing',
        attachmentPath: MEMO_ATTACHMENT_PATH,
        termInMonth: '1',
        destination: 'BCA QA AUTOMATION STAGING',
        amount: '100000',
      }),
    );

    expect(response.ok(), await response.text()).toBeTruthy();
    await memo.expectMemoCreated(imNumber);
  });

  test('[TC-MEMO-KR-001] @mutating membuat Memo Koordinasi (KR) valid', async ({
    page,
  }) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueReference('IM AUTO/KR', { random: false });

    await test.step('Buka daftar Internal Memo', async () => {
      await memo.goto();
    });

    const response = await test.step('Isi dan simpan Memo Koordinasi', async () =>
      memo.createKrMemo({
        imNumber,
        description: 'Memo Koordinasi dibuat otomatis oleh Playwright di staging.',
        attachmentPath: MEMO_ATTACHMENT_PATH,
        grandTotal: '1000000',
        termInMonth: '1',
      }),
    );

    expect(response.ok(), await response.text()).toBeTruthy();
    await memo.expectMemoCreated(imNumber);
  });
});
