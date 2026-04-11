// ============================================================
// mpesaRoutes.js
// Defines all M-Pesa payment endpoints.
// Mounted at /api/payments in server.js
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  stkPush,
  mpesaCallback,
  getPaymentStatus,
} = require('../controllers/mpesaController');

const { protect } = require('../middleware/authMiddleware');

// POST /api/payments/stkpush
// Trigger STK Push — protected (must be logged in)
router.post('/stkpush', protect, stkPush);

// POST /api/payments/callback
// Receive callback from Safaricom — NO auth (Safaricom calls this directly)
router.post('/callback', mpesaCallback);

// GET /api/payments/status/:orderId
// Check latest payment status for an order — protected
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;
