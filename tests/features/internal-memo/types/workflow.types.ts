export type ReviewStage = 'svp' | 'gm' | 'vp';
export type ReviewDecision = 'approve' | 'reject';

export type MemoStatus =
  | 'Draft'
  | 'Waiting SPV'
  | 'Reject SPV'
  | 'Waiting GM'
  | 'Approve GM'
  | 'Reject GM'
  | 'Waiting Payment'
  | 'Reject VP'
  | 'Finish Payment'
  | 'Closed';

export interface ReviewConfig {
  method: 'PATCH' | 'PUT';
  endpoint: string;
  expectedStatus: MemoStatus;
}
