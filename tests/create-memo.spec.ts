import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { InternalMemoPage } from './pages/internal-memo.page';

const attachmentPath = resolve('tests/fixtures/memo-automation.png');
const mutationEnabled = process.env.LEGAL_ALLOW_MEMO_CREATE === 'true';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} wajib diisi di file .env`);
  return value;
}

function uniqueMemoNumber(type: 'RR' | 'KR'): string {
  return `IM AUTO/${type}/${Date.now()}`;
}

test.describe('Legal staging — create Internal Memo @mutating', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_MEMO_CREATE=true untuk mengizinkan pembuatan data staging.',
  );
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(
      requiredEnv('LEGAL_USERNAME_ROLE_ADMIN_LEGAL'),
      requiredEnv('LEGAL_PASSWORD'),
    );
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test('[TC-MEMO-RR-001] @mutating membuat Memo Resmi (RR) valid', async ({
    page,
  }) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueMemoNumber('RR');

    await test.step('Buka daftar Internal Memo', async () => {
      await memo.goto();
    });

    const response = await test.step('Isi dan simpan Memo Resmi', async () =>
      memo.createRrMemo({
        imNumber,
        description: 'Memo Description Testing',
        attachmentPath,
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
    const imNumber = uniqueMemoNumber('KR');

    await test.step('Buka daftar Internal Memo', async () => {
      await memo.goto();
    });

    const response = await test.step('Isi dan simpan Memo Koordinasi', async () =>
      memo.createKrMemo({
        imNumber,
        description: 'Memo Koordinasi dibuat otomatis oleh Playwright di staging.',
        attachmentPath,
        grandTotal: '1000000',
        termInMonth: '1',
      }),
    );

    expect(response.ok(), await response.text()).toBeTruthy();
    await memo.expectMemoCreated(imNumber);
  });
});
