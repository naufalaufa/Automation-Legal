/**
 * Metadata role yang aman disimpan di source control.
 * Username dan password asli tetap dibaca dari .env pada saat test berjalan.
 */
export type LoginRole = {
  id: string;
  label: string;
  usernameEnv: string;
};

export const loginRoles: readonly LoginRole[] = [
  {
    id: 'SUPERADMIN',
    label: 'Super Admin',
    usernameEnv: 'LEGAL_USERNAME_ROLE_SUPERADMIN',
  },
  {
    id: 'VP',
    label: 'VP',
    usernameEnv: 'LEGAL_USERNAME_ROLE_VP',
  },
  {
    id: 'GENERAL_MANAGER',
    label: 'General Manager',
    usernameEnv: 'LEGAL_USERNAME_ROLE_GENERAL_MANAGER',
  },
  {
    id: 'SVP_LEGAL',
    label: 'SVP Legal',
    usernameEnv: 'LEGAL_USERNAME_ROLE_SVP_LEGAL',
  },
  {
    id: 'ADMIN_LEGAL',
    label: 'Admin Legal',
    usernameEnv: 'LEGAL_USERNAME_ROLE_ADMIN_LEGAL',
  },
  {
    id: 'STAFF_FINANCE',
    label: 'Staff Finance',
    usernameEnv: 'LEGAL_USERNAME_ROLE_STAFF_FINANCE',
  },
] as const;

/** Membaca environment variable dan memberi error yang mudah dipahami. */
function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Environment variable ${name} belum diisi di file .env.`);
  }

  return value;
}

/** Mengambil credential role tanpa pernah menaruh secret di file spec. */
export function credentialsFor(role: LoginRole): {
  username: string;
  password: string;
} {
  return {
    username: requiredEnv(role.usernameEnv),
    password: requiredEnv('LEGAL_PASSWORD'),
  };
}
