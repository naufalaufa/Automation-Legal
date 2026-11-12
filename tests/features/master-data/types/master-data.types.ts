import type { Response } from '@playwright/test';

export interface RecipientData {
  cityName: string;
  code: string;
  name: string;
  phoneNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export type InstitutionType = 'Resmi' | 'Koordinasi';
export type InstitutionCode = 'BAPENDA' | 'PPK' | 'PPW' | 'UPBP';

export interface InstitutionData {
  cityName: string;
  type: InstitutionType;
  institutionCode: InstitutionCode;
}

export interface InstitutionResult {
  created: boolean;
  name: string;
  response?: Response;
}

export interface InstitutionTestType {
  testId: 'RR' | 'KR';
  label: InstitutionType;
  defaultCode: InstitutionCode;
}
