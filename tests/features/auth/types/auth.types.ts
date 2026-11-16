import type { Page } from '@playwright/test';

export type LoginRoleId =
  | 'SUPERADMIN'
  | 'VP'
  | 'GENERAL_MANAGER'
  | 'SVP_LEGAL'
  | 'ADMIN_LEGAL'
  | 'STAFF_FINANCE'
  | 'AUDIT';

export type BackendRoleName =
  | 'superadmin'
  | 'wakil_direktur'
  | 'gm'
  | 'spv_legal'
  | 'admin'
  | 'staff_finance'
  | 'audit';

export interface LoginRole {
  id: LoginRoleId;
  label: string;
  usernameEnv: string;
  expectedRole: BackendRoleName;
}

export interface Credentials {
  username: string;
  password: string;
}

export interface LoginApiBody {
  data?: {
    user?: {
      role?: { name?: string } | null;
    };
  };
  message?: string;
  error_code?: string;
}

export type LegalRole =
  | 'superAdmin'
  | 'adminLegal'
  | 'svpLegal'
  | 'generalManager'
  | 'viceDirector'
  | 'staffFinance'
  | 'audit';

export type RoleAction<T> = (page: Page) => Promise<T>;

export type RunAsRole = <T>(
  role: LegalRole,
  action: RoleAction<T>,
) => Promise<T>;

export interface LegalRoleAuth {
  usernameEnv: string;
  expectedRole: BackendRoleName;
}
