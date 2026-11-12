import type {
  ReviewConfig,
  ReviewDecision,
  ReviewStage,
} from '../types/workflow.types';

export const reviewConfigs: Readonly<
  Record<ReviewStage, Record<ReviewDecision, ReviewConfig>>
> = {
  svp: {
    approve: {
      method: 'PATCH',
      endpoint: 'approve-spv',
      expectedStatus: 'Waiting GM',
    },
    reject: {
      method: 'PUT',
      endpoint: 'reject-spv',
      expectedStatus: 'Reject SPV',
    },
  },
  gm: {
    approve: {
      method: 'PUT',
      endpoint: 'approve-gm',
      expectedStatus: 'Approve GM',
    },
    reject: {
      method: 'PUT',
      endpoint: 'reject-gm',
      expectedStatus: 'Reject GM',
    },
  },
  vp: {
    approve: {
      method: 'PUT',
      endpoint: 'approve-vp',
      expectedStatus: 'Waiting Payment',
    },
    reject: {
      method: 'PUT',
      endpoint: 'reject-vp',
      expectedStatus: 'Reject VP',
    },
  },
};
