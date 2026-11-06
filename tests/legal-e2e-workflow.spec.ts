import { resolve } from 'node:path';
import {
  expect,
  test,
  type RunAsRole,
} from './fixtures/legal.fixture';
import {
  InternalMemoPage,
  type MemoType,
} from './pages/internal-memo.page';
import { MemoWorkflowPage } from './pages/memo-workflow.page';

const attachmentPath = resolve('tests/fixtures/memo-automation.png');
const mutationEnabled = process.env.LEGAL_ALLOW_E2E_WORKFLOW === 'true';

type CreatedMemo = {
  id: number;
  imNumber: string;
  type: MemoType;
};

function uniqueMemoNumber(type: MemoType): string {
  const randomSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `IM E2E/${type}/${Date.now()}-${randomSuffix}`;
}

/**
 * Admin Legal membuat memo baru dan langsung mengirimkannya ke SVP Legal.
 * Helper dipakai semua skenario agar setiap test memiliki data sendiri.
 */
async function createAndSubmitMemo(
  runAsRole: RunAsRole,
  type: MemoType,
): Promise<CreatedMemo> {
  return runAsRole('adminLegal', async (page) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueMemoNumber(type);

    await test.step(`Admin Legal membuat draft memo ${type}`, async () => {
      await memo.goto();
      const response =
        type === 'RR'
          ? await memo.createRrMemo({
              imNumber,
              description:
                'Memo E2E RR otomatis untuk validasi workflow Legal staging.',
              attachmentPath,
              termInMonth: '1',
              destination: 'BCA QA E2E LEGAL STAGING',
              amount: '100000',
            })
          : await memo.createKrMemo({
              imNumber,
              description:
                'Memo E2E KR otomatis untuk validasi workflow Legal staging.',
              attachmentPath,
              grandTotal: '1000000',
              termInMonth: '1',
            });

      expect(response.ok(), await response.text()).toBeTruthy();
      await memo.expectMemoCreated(imNumber);
    });

    const id = await test.step('Admin Legal membuka memo yang baru dibuat', () =>
      memo.openMemoByNumber(imNumber),
    );

    await test.step('Admin Legal mengirim memo ke SVP Legal', async () => {
      const workflow = new MemoWorkflowPage(page);
      await workflow.submit(id);
    });

    return { id, imNumber, type };
  });
}

async function approveMemo(
  runAsRole: RunAsRole,
  role: 'svpLegal' | 'generalManager' | 'viceDirector',
  stage: 'svp' | 'gm' | 'vp',
  memo: CreatedMemo,
): Promise<void> {
  await runAsRole(role, async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await workflow.review(memo.id, stage, 'approve');
  });
}

async function rejectMemo(
  runAsRole: RunAsRole,
  role: 'svpLegal' | 'generalManager' | 'viceDirector',
  stage: 'svp' | 'gm' | 'vp',
  memo: CreatedMemo,
  note: string,
): Promise<void> {
  await runAsRole(role, async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await workflow.review(memo.id, stage, 'reject', note);
  });
}

async function payAndCloseMemo(
  runAsRole: RunAsRole,
  memo: CreatedMemo,
): Promise<void> {
  await runAsRole('staffFinance', async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);

    await test.step('Staff Finance mengunggah bukti dan membayar memo', () =>
      workflow.pay(memo.id, memo.type, attachmentPath),
    );
  });

  // Permission staging saat ini menempatkan aksi close pada Admin Legal,
  // sedangkan Staff Finance hanya memiliki aksi pembayaran.
  await runAsRole('adminLegal', async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await test.step('Admin Legal mengunggah lampiran dan menutup memo', () =>
      workflow.close(memo.id, attachmentPath),
    );
  });
}

async function runHappyPath(
  runAsRole: RunAsRole,
  type: MemoType,
): Promise<void> {
  const memo = await createAndSubmitMemo(runAsRole, type);

  await test.step('SVP Legal menyetujui memo', () =>
    approveMemo(runAsRole, 'svpLegal', 'svp', memo),
  );
  await test.step('General Manager menyetujui memo', () =>
    approveMemo(runAsRole, 'generalManager', 'gm', memo),
  );
  await test.step('Wakil Direktur menyetujui memo', () =>
    approveMemo(runAsRole, 'viceDirector', 'vp', memo),
  );
  await payAndCloseMemo(runAsRole, memo);
}

test.describe('Legal staging — Internal Memo E2E workflow @e2e @mutating', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_E2E_WORKFLOW=true untuk mengizinkan perubahan workflow staging.',
  );
  test.setTimeout(180_000);

  test('[TC-E2E-RR-HAPPY] RR: create sampai Closed', async ({ runAsRole }) => {
    await runHappyPath(runAsRole, 'RR');
  });

  test('[TC-E2E-KR-HAPPY] KR: create sampai Closed', async ({ runAsRole }) => {
    await runHappyPath(runAsRole, 'KR');
  });

  test('[TC-E2E-RR-REJECT-SVP] RR ditolak SVP Legal', async ({
    runAsRole,
  }) => {
    const memo = await createAndSubmitMemo(runAsRole, 'RR');
    await test.step('SVP Legal menolak memo dengan catatan', () =>
      rejectMemo(
        runAsRole,
        'svpLegal',
        'svp',
        memo,
        'E2E QA: data memo perlu diperbaiki oleh Admin Legal.',
      ),
    );
  });

  test('[TC-E2E-RR-REJECT-GM] RR disetujui SVP lalu ditolak GM', async ({
    runAsRole,
  }) => {
    const memo = await createAndSubmitMemo(runAsRole, 'RR');
    await test.step('SVP Legal menyetujui memo', () =>
      approveMemo(runAsRole, 'svpLegal', 'svp', memo),
    );
    await test.step('General Manager menolak memo dengan catatan', () =>
      rejectMemo(
        runAsRole,
        'generalManager',
        'gm',
        memo,
        'E2E QA: pengajuan memerlukan revisi pada tahap General Manager.',
      ),
    );
  });

  test('[TC-E2E-RR-REJECT-VP] RR disetujui SVP dan GM lalu ditolak Wakil Direktur', async ({
    runAsRole,
  }) => {
    const memo = await createAndSubmitMemo(runAsRole, 'RR');
    await test.step('SVP Legal menyetujui memo', () =>
      approveMemo(runAsRole, 'svpLegal', 'svp', memo),
    );
    await test.step('General Manager menyetujui memo', () =>
      approveMemo(runAsRole, 'generalManager', 'gm', memo),
    );
    await test.step('Wakil Direktur menolak memo dengan catatan', () =>
      rejectMemo(
        runAsRole,
        'viceDirector',
        'vp',
        memo,
        'E2E QA: memo ditolak untuk validasi jalur Wakil Direktur.',
      ),
    );
  });
});
