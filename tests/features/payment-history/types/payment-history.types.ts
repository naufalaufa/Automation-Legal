import type { LegalRole } from '../../auth/types/auth.types';
import type {
  CreatedMemo,
  MemoType,
} from '../../internal-memo/types/memo.types';

export type PaymentHistorySurface =
  | 'internal-memo-dialog'
  | 'memo-pdf'
  | 'banner'
  | 'recipient';

export interface PaymentHistoryCase {
  sequence: number;
  type: MemoType;
  amount: string;
}

export interface PaymentHistoryRecord extends CreatedMemo {
  amount: string;
  branchCode: string;
  recipientName?: string;
}

export interface PaymentHistoryDataset {
  records: PaymentHistoryRecord[];
  recipientName: string;
}

export interface PaymentHistoryRoleAccess {
  role: LegalRole;
  label: string;
  surfaces: readonly PaymentHistorySurface[];
}
