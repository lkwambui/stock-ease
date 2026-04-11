// ============================================================
// mpesaConfig.js
// Loads and exports all M-Pesa Daraja sandbox credentials
// from environment variables so nothing is hardcoded.
// ============================================================

require('dotenv').config();

const mpesaConfig = {
  // --- OAuth credentials (get from developer.safaricom.co.ke) ---
  consumerKey:    process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,

  // --- STK Push (Lipa Na M-Pesa Online) sandbox values ---
  shortCode: process.env.MPESA_SHORTCODE   || '174379',
  passKey:   process.env.MPESA_PASSKEY     || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919',

  // --- Transaction type for STK Push ---
  transactionType: 'CustomerPayBillOnline',

  // --- Your callback URL (must be publicly accessible in sandbox) ---
  // Use ngrok locally:  ngrok http 5000  → copy the https URL
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-ngrok-url.ngrok.io/api/payments/callback',

  // --- Daraja sandbox base URL ---
  baseUrl: 'https://sandbox.safaricom.co.ke',
};

module.exports = mpesaConfig;
