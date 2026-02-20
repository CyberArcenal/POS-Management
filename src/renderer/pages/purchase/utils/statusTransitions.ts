// src/renderer/pages/purchase/utils/statusTransitions.ts
export const allowedNextStatuses = (currentStatus: string): string[] => {
  switch (currentStatus) {
    case 'pending':
      return ['approved', 'cancelled'];
    case 'approved':
      return ['completed', 'cancelled'];
    case 'completed':
      return []; // no further changes
    case 'cancelled':
      return []; // no further changes
    default:
      return [];
  }
};