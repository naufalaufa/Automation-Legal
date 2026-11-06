import { expect, test } from '@playwright/test';
import { dkiCities } from './data/dki-cities';
import { LoginPage } from './pages/login.page';
import { MasterDataPage } from './pages/master-data.page';

const mutationEnabled =
  process.env.LEGAL_ALLOW_MASTER_DATA_CREATE === 'true';

const institutionTypes = [
  { testId: 'RR', label: 'Resmi' },
  { testId: 'KR', label: 'Koordinasi' },
] as const;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} wajib diisi di file .env`);
  return value;
}

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
    const login = new LoginPage(page);
    await login.goto();
    await login.login(
      requiredEnv('LEGAL_USERNAME_ROLE_SUPERADMIN'),
      requiredEnv('LEGAL_PASSWORD'),
    );
    await expect(page).not.toHaveURL(/\/login$/);
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
        const suffix = uniqueSuffix();
        const institutionName =
          `QA AUTO Instansi ${institutionType.testId} ${city.shortCode} ${suffix}`;

        const response = await masterData.createInstitution({
          cityName: city.name,
          type: institutionType.label,
          code: `INS-${institutionType.testId}-${city.shortCode}-${suffix}`,
          name: institutionName,
        });

        expect(response.ok(), await response.text()).toBeTruthy();
        await masterData.expectCreated(institutionName);
      });
    }
  }
});

