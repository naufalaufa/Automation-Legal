import type {
  LegalRole,
  LegalRoleAuth,
  LoginRole,
} from '../types/auth.types';

export const loginRoles = [
  {
    id: 'SUPERADMIN',
    label: 'Super Admin',
    usernameEnv: 'LEGAL_USERNAME_ROLE_SUPERADMIN',
    expectedRole: 'superadmin',
  },
  {
    id: 'VP',
    label: 'Wakil Direktur',
    usernameEnv: 'LEGAL_USERNAME_ROLE_VP',
    expectedRole: 'wakil_direktur',
  },
  {
    id: 'GENERAL_MANAGER',
    label: 'General Manager',
    usernameEnv: 'LEGAL_USERNAME_ROLE_GENERAL_MANAGER',
    expectedRole: 'gm',
  },
  {
    id: 'SVP_LEGAL',
    label: 'SVP Legal',
    usernameEnv: 'LEGAL_USERNAME_ROLE_SVP_LEGAL',
    expectedRole: 'spv_legal',
  },
  {
    id: 'ADMIN_LEGAL',
    label: 'Admin Legal',
    usernameEnv: 'LEGAL_USERNAME_ROLE_ADMIN_LEGAL',
    expectedRole: 'admin',
  },
  {
    id: 'STAFF_FINANCE',
    label: 'Staff Finance',
    usernameEnv: 'LEGAL_USERNAME_ROLE_STAFF_FINANCE',
    expectedRole: 'staff_finance',
  },
] as const satisfies readonly LoginRole[];

export const legalRoleAuth: Readonly<Record<LegalRole, LegalRoleAuth>> = {
  superAdmin: {
    usernameEnv: 'LEGAL_USERNAME_ROLE_SUPERADMIN',
    expectedRole: 'superadmin',
  },
  adminLegal: {
    usernameEnv: 'LEGAL_USERNAME_ROLE_ADMIN_LEGAL',
    expectedRole: 'admin',
  },
  svpLegal: {
    usernameEnv: 'LEGAL_USERNAME_ROLE_SVP_LEGAL',
    expectedRole: 'spv_legal',
  },
  generalManager: {
    usernameEnv: 'LEGAL_USERNAME_ROLE_GENERAL_MANAGER',
    expectedRole: 'gm',
  },
  viceDirector: {
    usernameEnv: 'LEGAL_USERNAME_ROLE_VP',
    expectedRole: 'wakil_direktur',
  },
  staffFinance: {
    usernameEnv: 'LEGAL_USERNAME_ROLE_STAFF_FINANCE',
    expectedRole: 'staff_finance',
  },
};
