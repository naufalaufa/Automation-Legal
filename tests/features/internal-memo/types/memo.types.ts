export type MemoType = 'RR' | 'KR';
export type PaymentMethod = 'Tunai' | 'Transfer' | 'VA';

export interface RrPaymentData {
  method: PaymentMethod;
  destination: string;
  amount: string;
}

export interface SharedMemoData {
  imNumber: string;
  description: string;
  attachmentPath: string;
}

export interface KrMemoData extends SharedMemoData {
  grandTotal: string;
  termInMonth: string;
}

export interface RrMemoData extends SharedMemoData {
  termInMonth: string;
  destination: string;
  amount: string;
  paymentMethod?: PaymentMethod;
}

export interface RrMultiplePaymentsData extends SharedMemoData {
  termInMonth: string;
  payments: RrPaymentData[];
}

export interface CreatedMemo {
  id: number;
  imNumber: string;
  type: MemoType;
}

export interface WaitingMemo {
  id: number;
  imNumber: string;
}
