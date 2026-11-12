import type { InstitutionTestType } from '../types/master-data.types';

export const institutionTypes = [
  { testId: 'RR', label: 'Resmi', defaultCode: 'BAPENDA' },
  { testId: 'KR', label: 'Koordinasi', defaultCode: 'PPK' },
] as const satisfies readonly InstitutionTestType[];
