// ============================================================
// mpesaController.js
// Handles M-Pesa STK Push and Callback logic.
//
// Routes:
//   POST /api/payments/stkpush  — initiate payment
//   POST /api/payments/callback — receive Daraja callback
// ============================================================

const Payment = require('../models/Payment');
const Order   = require('../models/Order');
const { initiateSTKPush } = require('../services/mpesaService');

// ─────────────────────────────────────────────────────────────
// POST /api/payments/stkpush
// ─────────────────────────────────────────────────────────────
/**
 * stkPush
 * Validates input, creates a pending Payment record,
 * then triggers the Daraja STK Push API.
 *
 * Request body:
 *   { phoneNumber: "0712345678", amount: 1500, orderId: "..." }
 */
const stkPush = async (req, res) => {
  try {
    const { phoneNumber, amount, orderId } = req.body;

    // ── Validate required fields ──
    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumber, amount, and orderId are required.',
      });
    }

    // ── Confirm the order exists ──
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found: ${orderId}`,
      });
    }

    // ── Create a Pending payment record in the database ──
    const payment = await Payment.create({
      orderId,
      phoneNumber,
      amount,
      status: 'Pending',
    });

    console.log('[Payment] Created pending payment:', payment._id);

    // ── Trigger STK Push via Daraja ──
    const mpesaResponse = await initiateSTKPush(phoneNumber, amount, orderId);

    // ── Store the CheckoutRequestID so we can match the callback ──
    payment.checkoutRequestId = mpesaResponse.CheckoutRequestID;
    await payment.save();

    // ── Respond to client ──
    res.status(200).json({
      success: true,
      message: 'STK Push sent. Ask the customer to check their phone.',
      checkoutRequestId: mpesaResponse.CheckoutRequestID,
      paymentId: payment._id,
      mpesaResponse,
    });
  } catch (error) {
    console.error('[Payment] STK Push error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate STK Push.',
      error: error.response?.data || error.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payments/callback
// ─────────────────────────────────────────────────────────────
/**
 * mpesaCallback
 * Safaricom calls this URL after the customer completes
 * (or cancels) the STK Push prompt on their phone.
 *
 * This endpoint MUST return 200 immediately — Daraja retries
 * if it doesn't get a fast response.
 */
const mpesaCallback = async (req, res) => {
  // Always acknowledge Safaricom first
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    console.log('[Callback] Raw body:', JSON.stringify(req.body, null, 2));

    // ── Navigate to the callback result object ──
    const body           = req.body;
    const stkCallback    = body?.Body?.stkCallback;

    if (!stkCallback) {
      console.warn('[Callback] No stkCallback found in body.');
      return;
    }

    const resultCode       = stkCallback.ResultCode;
    const resultDesc       = stkCallback.ResultDesc;
    const checkoutRequestId = stkCallback.CheckoutRequestID;

    console.log(`[Callback] CheckoutRequestID: ${checkoutRequestId}`);
    console.log(`[Callback] ResultCode: ${resultCode} — ${resultDesc}`);

    // ── Find the matching payment record ──
    const payment = await Payment.findOne({ checkoutRequestId });

    if (!payment) {
      console.warn('[Callback] No payment record found for:', checkoutRequestId);
      return;
    }

    // ── Store the full callback for debugging ──
    payment.callbackData = stkCallback;

    if (resultCode === 0) {
      // ────────────────────────────────
      // SUCCESS — Transaction completed
      // ────────────────────────────────
      const items = stkCallback.CallbackMetadata?.Item || [];

      // Extract fields from the metadata array
      const getMeta = (name) =>
        items.find((i) => i.Name === name)?.Value || null;

      const mpesaReceiptNumber = getMeta('MpesaReceiptNumber');
      const transactionDate    = getMeta('TransactionDate');
      const paidPhone          = getMeta('PhoneNumber');
      const paidAmount         = getMeta('Amount');

      console.log(`[Callback] ✅ SUCCESS — Receipt: ${mpesaReceiptNumber}`);
      console.log(`[Callback]    Phone: ${paidPhone} | Amount: KShs ${paidAmount} | Date: ${transactionDate}`);

      // Update payment record
      payment.status             = 'Success';
      payment.mpesaReceiptNumber = mpesaReceiptNumber;
      await payment.save();

      // Update the linked order status → "Completed"
      await Order.findByIdAndUpdate(payment.orderId, { status: 'Completed' });
      console.log(`[Callback] Order ${payment.orderId} marked as Completed`);

    } else {
      // ────────────────────────────────
      // FAILED or CANCELLED
      // ────────────────────────────────
      console.log(`[Callback] ❌ FAILED — ${resultDesc}`);

      payment.status = 'Failed';
      await payment.save();
      // Order remains in its current status (Pending)
    }
  } catch (error) {
    console.error('[Callback] Processing error:', error.message);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/payments/status/:orderId
// ─────────────────────────────────────────────────────────────
/**
 * getPaymentStatus
 * Returns the latest payment record for a given order.
 * Useful for the frontend to poll after STK push.
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const payment = await Payment.findOne({ orderId })
      .sort({ createdAt: -1 })  // latest payment first
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'No payment found for this order.',
      });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    console.error('[Payment] Status fetch error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { stkPush, mpesaCallback, getPaymentStatus };
