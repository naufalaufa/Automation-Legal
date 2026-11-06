import {
  expect,
  type Locator,
  type Page,
  type Response,
} from '@playwright/test';
import type { MemoType } from './internal-memo.page';

export type ReviewStage = 'svp' | 'gm' | 'vp';
export type ReviewDecision = 'approve' | 'reject';

export type MemoStatus =
  | 'Draft'
  | 'Waiting SPV'
  | 'Reject SPV'
  | 'Waiting GM'
  | 'Approve GM'
  | 'Reject GM'
  | 'Waiting Payment'
  | 'Reject VP'
  | 'Finish Payment'
  | 'Closed';

type ReviewConfig = {
  method: 'PATCH' | 'PUT';
  endpoint: string;
  expectedStatus: MemoStatus;
};

const reviewConfigs: Record<
  ReviewStage,
  Record<ReviewDecision, ReviewConfig>
> = {
  svp: {
    approve: {
      method: 'PATCH',
      endpoint: 'approve-spv',
      expectedStatus: 'Waiting GM',
    },
    reject: {
      method: 'PUT',
      endpoint: 'reject-spv',
      expectedStatus: 'Reject SPV',
    },
  },
  gm: {
    approve: {
      method: 'PUT',
      endpoint: 'approve-gm',
      expectedStatus: 'Approve GM',
    },
    reject: {
      method: 'PUT',
      endpoint: 'reject-gm',
      expectedStatus: 'Reject GM',
    },
  },
  vp: {
    approve: {
      method: 'PUT',
      endpoint: 'approve-vp',
      expectedStatus: 'Waiting Payment',
    },
    reject: {
      method: 'PUT',
      endpoint: 'reject-vp',
      expectedStatus: 'Reject VP',
    },
  },
};

/** Page Object untuk aksi workflow pada halaman detail Internal Memo. */
export class MemoWorkflowPage {
  constructor(private readonly page: Page) {}

  async goto(memoId: number, imNumber: string): Promise<void> {
    await this.page.goto(`/internal-memo/${memoId}`);
    await expect(this.page).toHaveURL(
      new RegExp(`/internal-memo/${memoId}$`),
    );
    await expect(
      this.page.getByRole('heading', { name: imNumber, exact: true }),
    ).toBeVisible();
  }

  async expectStatus(status: MemoStatus): Promise<void> {
    await expect(
      this.page.getByText(status, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
  }

  async submit(memoId: number): Promise<void> {
    await this.expectStatus('Draft');
    await this.page
      .getByRole('button', { name: 'Kirim Memo', exact: true })
      .click();

    const dialog = this.page.getByRole('alertdialog');
    await expect(dialog.getByText('Kirim memo?', { exact: true })).toBeVisible();

    const responsePromise = this.waitForMemoResponse(
      memoId,
      'PUT',
      'submit',
    );
    await dialog
      .getByRole('button', { name: 'Kirim memo', exact: true })
      .click();
    await this.expectOk(await responsePromise);
    await expect(dialog).toBeHidden();
    await this.expectStatus('Waiting SPV');
  }

  async review(
    memoId: number,
    stage: ReviewStage,
    decision: ReviewDecision,
    rejectionNote?: string,
  ): Promise<void> {
    const config = reviewConfigs[stage][decision];
    const buttonName = decision === 'approve' ? 'Setujui' : 'Tolak';

    await this.page
      .getByRole('button', { name: buttonName, exact: true })
      .click();

    const dialog = this.page.getByRole('dialog');
    await expect(
      dialog.getByText(`${buttonName} memo?`, { exact: true }),
    ).toBeVisible();

    if (decision === 'reject') {
      if (!rejectionNote) {
        throw new Error('Catatan penolakan wajib diberikan untuk reject memo.');
      }
      await dialog.locator('textarea[name="notes"]').fill(rejectionNote);
    }

    const responsePromise = this.waitForMemoResponse(
      memoId,
      config.method,
      config.endpoint,
    );
    await dialog
      .getByRole('button', { name: buttonName, exact: true })
      .click();
    await this.expectOk(await responsePromise);
    await expect(dialog).toBeHidden();
    await this.expectStatus(config.expectedStatus);
  }

  async pay(
    memoId: number,
    memoType: MemoType,
    evidencePath: string,
  ): Promise<void> {
    await this.expectStatus('Waiting Payment');
    await this.page
      .getByRole('button', { name: 'Bayar Memo', exact: true })
      .click();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(
        memoType === 'RR'
          ? 'Pembayaran Memo Resmi'
          : 'Pembayaran Memo Koordinasi',
        { exact: true },
      ),
    ).toBeVisible();

    const uploads = dialog.locator('input[type="file"]');
    await expect(uploads).toHaveCount(1);
    await this.uploadAndWait(uploads.first(), evidencePath);

    const responsePromise = this.waitForMemoResponse(
      memoId,
      'POST',
      'payment-proof',
    );
    await dialog
      .getByRole('button', { name: 'Simpan pembayaran', exact: true })
      .click();
    await this.expectOk(await responsePromise);
    await expect(dialog).toBeHidden();
    await this.expectStatus('Finish Payment');
  }

  async close(memoId: number, attachmentPath: string): Promise<void> {
    await this.expectStatus('Finish Payment');
    await this.page
      .getByRole('button', { name: 'Tutup Memo', exact: true })
      .click();

    const dialog = this.page.getByRole('dialog');
    await expect(dialog.getByText('Tutup memo?', { exact: true })).toBeVisible();
    await this.uploadAndWait(
      dialog.locator('input[type="file"]'),
      attachmentPath,
    );

    const responsePromise = this.waitForMemoResponse(
      memoId,
      'POST',
      'close',
    );
    await dialog
      .getByRole('button', { name: 'Tutup memo', exact: true })
      .click();
    await this.expectOk(await responsePromise);
    await expect(dialog).toBeHidden();
    await this.expectStatus('Closed');
  }

  private waitForMemoResponse(
    memoId: number,
    method: string,
    endpoint: string,
  ): Promise<Response> {
    return this.page.waitForResponse(
      (response) =>
        response.request().method() === method &&
        response.url().endsWith(`/api/v1/master/memo/${memoId}/${endpoint}`),
    );
  }

  private async expectOk(response: Response): Promise<void> {
    const body = await response.text();
    expect(response.ok(), body).toBeTruthy();
  }

  private async uploadAndWait(
    input: Locator,
    attachmentPath: string,
  ): Promise<void> {
    const uploadFinished = this.page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        response.url().includes('amazonaws.com') &&
        response.ok(),
    );
    await input.setInputFiles(attachmentPath);
    await uploadFinished;
  }
}
