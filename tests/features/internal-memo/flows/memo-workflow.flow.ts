import { expect, test } from '../../../fixtures/legal.fixture';
import { uniqueReference } from '../../../support/identifiers';
import { MEMO_ATTACHMENT_PATH } from '../../../support/paths';
import type { RunAsRole } from '../../auth/types/auth.types';
import { InternalMemoPage } from '../pages/internal-memo.page';
import { MemoWorkflowPage } from '../pages/memo-workflow.page';
import type { CreatedMemo, MemoType } from '../types/memo.types';
import type { ReviewStage } from '../types/workflow.types';

export async function createAndSubmitMemo(
  runAsRole: RunAsRole,
  type: MemoType,
): Promise<CreatedMemo> {
  return runAsRole('adminLegal', async (page) => {
    const memo = new InternalMemoPage(page);
    const imNumber = uniqueReference(`IM E2E/${type}`);

    await test.step(`Admin Legal membuat draft memo ${type}`, async () => {
      await memo.goto();
      const response =
        type === 'RR'
          ? await memo.createRrMemo({
              imNumber,
              description:
                'Memo E2E RR otomatis untuk validasi workflow Legal staging.',
              attachmentPath: MEMO_ATTACHMENT_PATH,
              termInMonth: '1',
              destination: 'BCA QA E2E LEGAL STAGING',
              amount: '100000',
            })
          : await memo.createKrMemo({
              imNumber,
              description:
                'Memo E2E KR otomatis untuk validasi workflow Legal staging.',
              attachmentPath: MEMO_ATTACHMENT_PATH,
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
      await new MemoWorkflowPage(page).submit(id);
    });

    return { id, imNumber, type };
  });
}

export async function approveMemo(
  runAsRole: RunAsRole,
  role: 'svpLegal' | 'generalManager' | 'viceDirector',
  stage: ReviewStage,
  memo: CreatedMemo,
): Promise<void> {
  await runAsRole(role, async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await workflow.review(memo.id, stage, 'approve');
  });
}

export async function rejectMemo(
  runAsRole: RunAsRole,
  role: 'svpLegal' | 'generalManager' | 'viceDirector',
  stage: ReviewStage,
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
      workflow.pay(memo.id, memo.type, MEMO_ATTACHMENT_PATH),
    );
  });

  await runAsRole('adminLegal', async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await test.step('Admin Legal mengunggah lampiran dan menutup memo', () =>
      workflow.close(memo.id, MEMO_ATTACHMENT_PATH),
    );
  });
}

export async function runHappyPath(
  runAsRole: RunAsRole,
  type: MemoType,
): Promise<void> {
  await test.step('Validasi akun Staff Finance', () =>
    runAsRole('staffFinance', async () => undefined),
  );

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
