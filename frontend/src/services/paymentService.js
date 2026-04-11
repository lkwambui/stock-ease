// ============================================================
// paymentService.js
// Axios calls for M-Pesa payment features.
// ============================================================

import api from './api';

export const paymentService = {
  /**
   * Trigger STK Push on the customer's phone.
   * POST /api/payments/stkpush
   */
  stkPush: (phoneNumber, amount, orderId) =>
    api.post('/payments/stkpush', { phoneNumber, amount, orderId }),

  /**
   * Check the latest payment status for an order.
   * GET /api/payments/status/:orderId
   */
  getStatus: (orderId) => api.get(`/payments/status/${orderId}`),
};
