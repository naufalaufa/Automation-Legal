import { expect, test } from '../../../fixtures/legal.fixture';
import { uniqueReference } from '../../../support/identifiers';
import { MEMO_ATTACHMENT_PATH } from '../../../support/paths';
import type { RunAsRole } from '../../auth/types/auth.types';
import {
  approveMemo,
  payAndCloseMemo,
} from '../../internal-memo/flows/memo-workflow.flow';
import { InternalMemoPage } from '../../internal-memo/pages/internal-memo.page';
import { MemoWorkflowPage } from '../../internal-memo/pages/memo-workflow.page';
import type { CreatedMemo } from '../../internal-memo/types/memo.types';
import {
  paymentHistoryBranchCode,
  paymentHistoryCases,
} from '../data/payment-history.data';
import type {
  PaymentHistoryCase,
  PaymentHistoryDataset,
  PaymentHistoryRecord,
} from '../types/payment-history.types';

async function createAndSubmitHistoryMemo(
  runAsRole: RunAsRole,
  historyCase: PaymentHistoryCase,
  recipientName?: string,
): Promise<PaymentHistoryRecord> {
  return runAsRole('adminLegal', async (page) => {
    const memoPage = new InternalMemoPage(page);
    const imNumber = uniqueReference(
      `IM QA/HISTORY/${historyCase.sequence}/${historyCase.type}`,
    );
    let selectedRecipient = recipientName;

    await test.step(
      `Membuat memo ${historyCase.sequence}/5 (${historyCase.type})`,
      async () => {
        await memoPage.goto();

        if (historyCase.type === 'RR') {
          const response = await memoPage.createRrMemo({
            imNumber,
            description: `QA payment history RR urutan ${historyCase.sequence}.`,
            attachmentPath: MEMO_ATTACHMENT_PATH,
            termInMonth: '1',
            branchCode: paymentHistoryBranchCode,
            paymentMethod: 'Tunai',
            destination: 'QA PAYMENT HISTORY STAGING',
            amount: historyCase.amount,
          });
          expect(response.ok(), await response.text()).toBeTruthy();
        } else {
          const result = await memoPage.createKrMemoWithSelection({
            imNumber,
            description: `QA payment history KR urutan ${historyCase.sequence}.`,
            attachmentPath: MEMO_ATTACHMENT_PATH,
            termInMonth: '1',
            branchCode: paymentHistoryBranchCode,
            recipientName,
            grandTotal: historyCase.amount,
          });
          expect(result.response.ok(), await result.response.text()).toBeTruthy();
          selectedRecipient = result.recipientName;
        }

        await memoPage.expectMemoCreated(imNumber);
      },
    );

    const id = await memoPage.openMemoByNumber(imNumber);
    await new MemoWorkflowPage(page).submit(id);

    return {
      id,
      imNumber,
      type: historyCase.type,
      amount: historyCase.amount,
      branchCode: paymentHistoryBranchCode,
      recipientName: selectedRecipient,
    };
  });
}

async function approvePayAndClose(
  runAsRole: RunAsRole,
  memo: PaymentHistoryRecord,
): Promise<void> {
  const createdMemo: CreatedMemo = memo;
  await approveMemo(runAsRole, 'svpLegal', 'svp', createdMemo);
  await approveMemo(runAsRole, 'generalManager', 'gm', createdMemo);
  await approveMemo(runAsRole, 'viceDirector', 'vp', createdMemo);
  await payAndCloseMemo(runAsRole, createdMemo);
}

/**
 * Membuat tepat lima pembayaran secara berurutan. Penerima KR pertama disimpan
 * lalu digunakan kembali agar kedua transaksi KR masuk ke halaman yang sama.
 */
export async function createPaymentHistoryDataset(
  runAsRole: RunAsRole,
): Promise<PaymentHistoryDataset> {
  const records: PaymentHistoryRecord[] = [];
  let recipientName: string | undefined;

  for (const historyCase of paymentHistoryCases) {
    const memo = await createAndSubmitHistoryMemo(
      runAsRole,
      historyCase,
      recipientName,
    );
    await approvePayAndClose(runAsRole, memo);

    if (memo.type === 'KR') recipientName = memo.recipientName;
    records.push(memo);
  }

  if (!recipientName) {
    throw new Error('Penerima KR tidak ditemukan dari hasil pembuatan memo.');
  }

  return { records, recipientName };
}
