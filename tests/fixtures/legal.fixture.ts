import {
  test as base,
  type BrowserContext,
} from '@playwright/test';
import { loginAsLegalRole } from '../features/auth/support/credentials';
import type {
  LegalRole,
  RoleAction,
  RunAsRole,
} from '../features/auth/types/auth.types';

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
        await loginAsLegalRole(page, role);
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

export { expect } from '@playwright/test';
