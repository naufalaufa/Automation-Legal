import type { Page } from '@playwright/test';
import { requiredEnv } from '../../../support/env';
import { legalRoleAuth } from '../data/roles.data';
import { LoginPage } from '../pages/login.page';
import type {
  Credentials,
  LegalRole,
  LoginRole,
} from '../types/auth.types';

export function credentialsFor(role: LoginRole): Credentials {
  return {
    username: requiredEnv(role.usernameEnv),
    password: requiredEnv('LEGAL_PASSWORD'),
  };
}

export async function loginAsLoginRole(
  page: Page,
  role: LoginRole,
): Promise<void> {
  const login = new LoginPage(page);
  const credentials = credentialsFor(role);
  await login.goto();
  await login.loginExpectingRole(
    credentials.username,
    credentials.password,
    role.expectedRole,
  );
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });
}

export async function loginAsLegalRole(
  page: Page,
  role: LegalRole,
): Promise<void> {
  const auth = legalRoleAuth[role];
  const login = new LoginPage(page);
  await login.goto();
  await login.loginExpectingRole(
    requiredEnv(auth.usernameEnv),
    requiredEnv('LEGAL_PASSWORD'),
    auth.expectedRole,
  );
  await page.waitForURL((url) => url.pathname === '/', { timeout: 15_000 });
}
