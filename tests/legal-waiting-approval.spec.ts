import { resolve } from 'node:path';
import {
  expect,
  test,
  type LegalRole,
  type RunAsRole,
} from './fixtures/legal.fixture';
import { InternalMemoPage } from './pages/internal-memo.page';
import {
  MemoWorkflowPage,
  type MemoStatus,
  type ReviewStage,
} from './pages/memo-workflow.page';

const attachmentPath = resolve('tests/fixtures/memo-automation.png');
const mutationEnabled =
  process.env.LEGAL_ALLOW_WAITING_APPROVAL === 'true';

type WaitingMemo = {
  id: number;
  imNumber: string;
};

function uniqueMemoNumber(): string {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `IM WAIT/RR/${Date.now()}-${suffix}`;
}

/** Membuat RR baru dan mengirimkannya sampai antrean SVP Legal. */
async function createMemoWaitingForSvp(
  runAsRole: RunAsRole,
): Promise<WaitingMemo> {
  return runAsRole('adminLegal', async (page) => {
    const memoPage = new InternalMemoPage(page);
    const imNumber = uniqueMemoNumber();

    await test.step('Admin Legal membuat draft RR dengan data unik', async () => {
      await memoPage.goto();
      const response = await memoPage.createRrMemo({
        imNumber,
        description:
          'Memo otomatis untuk validasi hierarki waiting approval Legal staging.',
        attachmentPath,
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

    await test.step('Admin Legal mengirim memo ke SVP Legal', async () => {
      const workflow = new MemoWorkflowPage(page);
      await workflow.submit(id);
    });

    return { id, imNumber };
  });
}

/** Menyetujui satu tingkat dan berhenti sebelum reviewer berikutnya bertindak. */
async function approveStage(
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

/** Login sebagai reviewer tujuan dan validasi status serta action approval. */
async function expectWaitingForRole(
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

test.describe('Legal staging — waiting approval hierarchy @waiting @mutating', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_WAITING_APPROVAL=true untuk membuat memo waiting di staging.',
  );
  test.setTimeout(120_000);

  test('[TC-WAIT-SVP-001] memo berhenti pada Waiting SPV', async ({
    runAsRole,
  }) => {
    const memo = await createMemoWaitingForSvp(runAsRole);

    await test.step('SVP Legal menerima antrean approval', () =>
      expectWaitingForRole(runAsRole, 'svpLegal', memo, 'Waiting SPV'),
    );
  });

  test('[TC-WAIT-GM-001] memo berhenti pada Waiting GM', async ({
    runAsRole,
  }) => {
    const memo = await createMemoWaitingForSvp(runAsRole);

    await test.step('SVP Legal menyetujui memo', () =>
      approveStage(runAsRole, 'svpLegal', 'svp', memo),
    );
    await test.step('General Manager menerima antrean approval', () =>
      expectWaitingForRole(runAsRole, 'generalManager', memo, 'Waiting GM'),
    );
  });

  test('[TC-WAIT-VP-001] memo berhenti menunggu Wakil Direktur', async ({
    runAsRole,
  }) => {
    const memo = await createMemoWaitingForSvp(runAsRole);

    await test.step('SVP Legal menyetujui memo', () =>
      approveStage(runAsRole, 'svpLegal', 'svp', memo),
    );
    await test.step('General Manager menyetujui memo', () =>
      approveStage(runAsRole, 'generalManager', 'gm', memo),
    );
    await test.step('Wakil Direktur menerima antrean approval', () =>
      expectWaitingForRole(runAsRole, 'viceDirector', memo, 'Approve GM'),
    );
  });
});
