import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { LoginPage } from '../pages/login.page';

export type LegalRole =
  | 'adminLegal'
  | 'svpLegal'
  | 'generalManager'
  | 'viceDirector'
  | 'staffFinance';

type RoleAction<T> = (page: Page) => Promise<T>;
export type RunAsRole = <T>(
  role: LegalRole,
  action: RoleAction<T>,
) => Promise<T>;

const roleUsernameVariables: Record<LegalRole, string> = {
  adminLegal: 'LEGAL_USERNAME_ROLE_ADMIN_LEGAL',
  svpLegal: 'LEGAL_USERNAME_ROLE_SVP_LEGAL',
  generalManager: 'LEGAL_USERNAME_ROLE_GENERAL_MANAGER',
  // Di aplikasi, akun Wakil Direktur dikonfigurasi sebagai role VP.
  viceDirector: 'LEGAL_USERNAME_ROLE_VP',
  staffFinance: 'LEGAL_USERNAME_ROLE_STAFF_FINANCE',
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} wajib diisi di file .env`);
  return value;
}

/**
 * Fixture callback untuk pergantian role dalam satu business flow.
 * Setiap role memakai BrowserContext baru agar cookie/session tidak bocor
 * antarroll, lalu context selalu ditutup walaupun assertion gagal.
 */
export const test = base.extend<{ runAsRole: RunAsRole }>({
  runAsRole: async ({ browser }, use) => {
    const openContexts = new Set<BrowserContext>();

    await use(async <T>(role: LegalRole, action: RoleAction<T>): Promise<T> => {
      const context = await browser.newContext();
      openContexts.add(context);
      const page = await context.newPage();

      try {
        const login = new LoginPage(page);
        await login.goto();
        await login.login(
          requiredEnv(roleUsernameVariables[role]),
          requiredEnv('LEGAL_PASSWORD'),
        );
        await expect(page).not.toHaveURL(/\/login$/);
        return await action(page);
      } finally {
        openContexts.delete(context);
        await context.close();
      }
    });

    // Safety net jika setup/action berhenti sebelum callback menutup context.
    await Promise.all([...openContexts].map((context) => context.close()));
  },
});

export { expect };
