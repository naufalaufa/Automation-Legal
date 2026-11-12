import { test } from '../../../fixtures/legal.fixture';
import { featureEnabled } from '../../../support/env';
import {
  approveMemo,
  createAndSubmitMemo,
  rejectMemo,
  runHappyPath,
} from '../flows/memo-workflow.flow';

const mutationEnabled = featureEnabled('LEGAL_ALLOW_E2E_WORKFLOW');

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
