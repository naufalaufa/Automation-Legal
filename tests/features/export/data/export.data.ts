import type { LoginRoleId } from '../../auth/types/auth.types';
import type {
  ExportTargetId,
  ListExportTarget,
} from '../types/export.types';

export const listExportTargets = [
  {
    id: 'internal-memo',
    route: '/internal-memo/',
    pageHeading: 'Internal Memo',
    dialogHeading: 'Export Internal Memo',
    filePrefix: 'internal-memo',
  },
  {
    id: 'penerima',
    route: '/penerima/',
    pageHeading: 'Penerima',
    dialogHeading: 'Export Penerima',
    filePrefix: 'penerima',
  },
  {
    id: 'instansi',
    route: '/instansi/',
    pageHeading: 'Instansi',
    dialogHeading: 'Export Instansi',
    filePrefix: 'instansi',
  },
  {
    id: 'banner',
    route: '/banner/',
    pageHeading: 'Banner',
    dialogHeading: 'Export Banner',
    filePrefix: 'banner',
  },
] as const satisfies readonly ListExportTarget[];

export const exportPermissions: Readonly<
  Record<LoginRoleId, readonly ExportTargetId[]>
> = {
  SUPERADMIN: [
    'internal-memo',
    'penerima',
    'instansi',
    'banner',
    'banner-payment-history',
  ],
  VP: [
    'internal-memo',
    'penerima',
    'instansi',
    'banner',
    'banner-payment-history',
  ],
  GENERAL_MANAGER: ['internal-memo', 'penerima'],
  SVP_LEGAL: [
    'internal-memo',
    'penerima',
    'instansi',
    'banner',
    'banner-payment-history',
  ],
  ADMIN_LEGAL: [
    'internal-memo',
    'penerima',
    'instansi',
    'banner',
    'banner-payment-history',
  ],
  STAFF_FINANCE: [
    'internal-memo',
    'penerima',
    'banner',
    'banner-payment-history',
  ],
};
