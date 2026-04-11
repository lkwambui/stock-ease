// ============================================================
// Payment.js  (Mongoose Model)
// Stores every M-Pesa payment attempt linked to an order.
// ============================================================

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Reference to the order being paid for
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    // Customer phone number (formatted: 2547XXXXXXXX)
    phoneNumber: {
      type: String,
      required: true,
    },

    // Amount paid in KES
    amount: {
      type: Number,
      required: true,
    },

    // Payment lifecycle status
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Pending',
    },

    // M-Pesa transaction receipt number (set on success)
    mpesaReceiptNumber: {
      type: String,
      default: null,
    },

    // Daraja CheckoutRequestID — used to match the callback
    checkoutRequestId: {
      type: String,
      default: null,
    },

    // Raw callback body stored for debugging / auditing
    callbackData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model('Payment', paymentSchema);
