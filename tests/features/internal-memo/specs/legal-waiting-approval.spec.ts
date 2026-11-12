import { test } from '../../../fixtures/legal.fixture';
import { featureEnabled } from '../../../support/env';
import {
  approveStage,
  createMemoWaitingForSvp,
  expectWaitingForRole,
} from '../flows/waiting-approval.flow';

const mutationEnabled = featureEnabled('LEGAL_ALLOW_WAITING_APPROVAL');

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
