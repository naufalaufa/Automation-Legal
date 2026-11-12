import { test } from '@playwright/test';
import { optionalEnv } from '../../../support/env';
import { loginRoles } from '../../auth/data/roles.data';
import { loginAsLoginRole } from '../../auth/support/credentials';
import {
  exportPermissions,
  listExportTargets,
} from '../data/export.data';
import { ExportPage } from '../pages/export.page';

const paymentHistoryBranch = optionalEnv(
  'LEGAL_EXPORT_BANNER_BRANCH_CODE',
  'GGP001',
);

test.use({ storageState: { cookies: [], origins: [] } });

for (const role of loginRoles) {
  test.describe(`Export sebagai ${role.label}`, () => {
    for (const target of listExportTargets) {
      const isAllowed = exportPermissions[role.id]?.includes(target.id) ?? false;
      const expectation = isAllowed ? 'berhasil mengunduh' : 'tidak tersedia';
      const targetTag = target.id === 'banner' ? 'banner-list' : target.id;

      test(`[TC-EXPORT-${target.id.toUpperCase()}-${role.id}] @export @export-target-${targetTag} ${role.label} — ${target.pageHeading} ${expectation}`, async ({
        page,
      }, testInfo) => {
        const exportPage = new ExportPage(page);

        await test.step(`Login sebagai ${role.label}`, async () => {
          await loginAsLoginRole(page, role);
        });

        await test.step(
          isAllowed
            ? `Klik Export ${target.pageHeading} dan validasi XLSX`
            : `Validasi Export ${target.pageHeading} tidak diberikan`,
          async () => {
            if (isAllowed) {
              await exportPage.downloadListExport(target, testInfo);
              return;
            }

            await exportPage.expectListExportUnavailable(target);
          },
        );
      });
    }

    const canExportPaymentHistory =
      exportPermissions[role.id]?.includes('banner-payment-history') ?? false;
    const paymentExpectation = canExportPaymentHistory
      ? 'berhasil mengunduh'
      : 'tidak tersedia';

    test(`[TC-EXPORT-BANNER-PAYMENT-${role.id}] @export @export-target-banner-payment ${role.label} — Banner Detail ${paymentExpectation}`, async ({
      page,
    }, testInfo) => {
      const exportPage = new ExportPage(page);

      await test.step(`Login sebagai ${role.label}`, async () => {
        await loginAsLoginRole(page, role);
      });

      await test.step(
        canExportPaymentHistory
          ? `Buka riwayat ${paymentHistoryBranch} dan validasi XLSX`
          : 'Validasi riwayat pembayaran tidak dapat diakses',
        async () => {
          if (canExportPaymentHistory) {
            await exportPage.downloadBannerPaymentHistory(
              paymentHistoryBranch,
              testInfo,
            );
            return;
          }

          await exportPage.expectBannerPaymentHistoryUnavailable();
        },
      );
    });
  });
}
