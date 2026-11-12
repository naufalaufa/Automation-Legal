import { expect, test } from '@playwright/test';
import { featureEnabled } from '../../../support/env';
import { loginAsLegalRole } from '../../auth/support/credentials';
import { dkiCities } from '../data/dki-cities.data';
import { institutionTypes } from '../data/institution-types.data';
import { MasterDataPage } from '../pages/master-data.page';

const mutationEnabled = featureEnabled('LEGAL_ALLOW_MASTER_DATA_CREATE');

function uniqueSuffix(): string {
  return Date.now().toString();
}

test.describe('Legal staging — create master data @mutating', () => {
  test.skip(
    !mutationEnabled,
    'Set LEGAL_ALLOW_MASTER_DATA_CREATE=true untuk mengizinkan perubahan master data staging.',
  );
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await loginAsLegalRole(page, 'superAdmin');
  });

  for (const city of dkiCities) {
    test(`[TC-PENERIMA-${city.slug}] @mutating membuat Penerima di ${city.name}`, async ({
      page,
    }) => {
      const masterData = new MasterDataPage(page);
      const suffix = uniqueSuffix();
      const recipientName = `QA AUTO Penerima ${city.shortCode} ${suffix}`;

      const response = await masterData.createRecipient({
        cityName: city.name,
        code: `PNR-AUTO-${city.shortCode}-${suffix}`,
        name: recipientName,
        phoneNumber: `08${suffix.slice(-10)}`,
        bankName: 'BANK BCA',
        accountNumber: `99${suffix.slice(-10)}`,
        accountName: recipientName,
      });

      expect(response.ok(), await response.text()).toBeTruthy();
      await masterData.expectCreated(recipientName);
    });

    for (const institutionType of institutionTypes) {
      test(`[TC-INSTANSI-${institutionType.testId}-${city.slug}] @mutating membuat Instansi ${institutionType.label} di ${city.name}`, async ({
        page,
      }) => {
        const masterData = new MasterDataPage(page);
        // PPK Koordinasi Jakarta Pusat sudah menjadi seed staging. PPW dipakai
        // agar skenario tetap membuat kombinasi valid yang belum ada.
        const institutionCode =
          institutionType.testId === 'KR' && city.slug === 'JAKARTA-PUSAT'
            ? 'PPW'
            : institutionType.defaultCode;

        const result = await masterData.createInstitution({
          cityName: city.name,
          type: institutionType.label,
          institutionCode,
        });

        if (result.response) {
          expect(
            result.response.ok(),
            await result.response.text(),
          ).toBeTruthy();
        }
        await masterData.expectCreated(result.name);
      });
    }
  }
});

