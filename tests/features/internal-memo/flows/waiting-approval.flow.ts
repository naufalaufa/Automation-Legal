import { expect, test } from '../../../fixtures/legal.fixture';
import { uniqueReference } from '../../../support/identifiers';
import { MEMO_ATTACHMENT_PATH } from '../../../support/paths';
import type {
  LegalRole,
  RunAsRole,
} from '../../auth/types/auth.types';
import { InternalMemoPage } from '../pages/internal-memo.page';
import { MemoWorkflowPage } from '../pages/memo-workflow.page';
import type { WaitingMemo } from '../types/memo.types';
import type {
  MemoStatus,
  ReviewStage,
} from '../types/workflow.types';

export async function createMemoWaitingForSvp(
  runAsRole: RunAsRole,
): Promise<WaitingMemo> {
  return runAsRole('adminLegal', async (page) => {
    const memoPage = new InternalMemoPage(page);
    const imNumber = uniqueReference('IM WAIT/RR');

    await test.step('Admin Legal membuat draft RR dengan data unik', async () => {
      await memoPage.goto();
      const response = await memoPage.createRrMemo({
        imNumber,
        description:
          'Memo otomatis untuk validasi hierarki waiting approval Legal staging.',
        attachmentPath: MEMO_ATTACHMENT_PATH,
        termInMonth: '1',
        destination: 'BCA QA WAITING APPROVAL STAGING',
        amount: '100000',
      });
      expect(response.ok(), await response.text()).toBeTruthy();
      await memoPage.expectMemoCreated(imNumber);
    });

    const id = await test.step('Admin Legal membuka memo yang baru dibuat', () =>
      memoPage.openMemoByNumber(imNumber),
    );

    await test.step('Admin Legal mengirim memo ke SVP Legal', () =>
      new MemoWorkflowPage(page).submit(id),
    );
    return { id, imNumber };
  });
}

export async function approveStage(
  runAsRole: RunAsRole,
  role: Extract<LegalRole, 'svpLegal' | 'generalManager'>,
  stage: Extract<ReviewStage, 'svp' | 'gm'>,
  memo: WaitingMemo,
): Promise<void> {
  await runAsRole(role, async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await workflow.review(memo.id, stage, 'approve');
  });
}

export async function expectWaitingForRole(
  runAsRole: RunAsRole,
  role: Extract<LegalRole, 'svpLegal' | 'generalManager' | 'viceDirector'>,
  memo: WaitingMemo,
  expectedStatus: MemoStatus,
): Promise<void> {
  await runAsRole(role, async (page) => {
    const workflow = new MemoWorkflowPage(page);
    await workflow.goto(memo.id, memo.imNumber);
    await workflow.expectReadyForReview(expectedStatus);
  });
}
