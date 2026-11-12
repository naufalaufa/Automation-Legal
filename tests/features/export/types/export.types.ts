export type ListExportId =
  | 'internal-memo'
  | 'penerima'
  | 'instansi'
  | 'banner';

export type ExportTargetId = ListExportId | 'banner-payment-history';

export interface ListExportTarget {
  id: ListExportId;
  route: string;
  pageHeading: string;
  dialogHeading: string;
  filePrefix: string;
}
