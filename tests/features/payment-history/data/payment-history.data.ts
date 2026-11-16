import type {
  PaymentHistoryCase,
  PaymentHistoryRoleAccess,
} from '../types/payment-history.types';

/**
 * Lima transaksi unik agar setiap row dapat dibedakan tanpa bergantung pada
 * urutan tabel. Nilai tetap berada di atas minimum nominal staging.
 */
export const paymentHistoryCases = [
  { sequence: 1, type: 'RR', amount: '501000' },
  { sequence: 2, type: 'KR', amount: '502000' },
  { sequence: 3, type: 'RR', amount: '503000' },
  { sequence: 4, type: 'KR', amount: '504000' },
  { sequence: 5, type: 'RR', amount: '505000' },
] as const satisfies readonly PaymentHistoryCase[];

export const paymentHistoryBranchCode = 'GGP005';

/**
 * Kontrak akses yang diharapkan. General Manager tidak memiliki menu Banner,
 * sehingga test memverifikasi ketiadaan akses alih-alih memaksakan navigasi.
 */
export const paymentHistoryRoleAccess = [
  {
    role: 'superAdmin',
    label: 'Super Admin',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'banner', 'recipient'],
  },
  {
    role: 'viceDirector',
    label: 'Wakil Direktur',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'banner', 'recipient'],
  },
  {
    role: 'generalManager',
    label: 'General Manager',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'recipient'],
  },
  {
    role: 'svpLegal',
    label: 'SVP Legal',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'banner', 'recipient'],
  },
  {
    role: 'adminLegal',
    label: 'Admin Legal',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'banner', 'recipient'],
  },
  {
    role: 'staffFinance',
    label: 'Staff Finance',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'banner', 'recipient'],
  },
  {
    role: 'audit',
    label: 'Audit',
    surfaces: ['internal-memo-dialog', 'memo-pdf', 'banner', 'recipient'],
  },
] as const satisfies readonly PaymentHistoryRoleAccess[];
