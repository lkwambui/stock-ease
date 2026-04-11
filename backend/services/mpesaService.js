// ============================================================
// mpesaService.js
// Core M-Pesa Daraja API helpers:
//   1. getAccessToken()  — OAuth2 bearer token
//   2. initiateSTKPush() — triggers STK push to customer phone
// ============================================================

const axios  = require('axios');
const mpesa  = require('../config/mpesaConfig');

/**
 * generateTimestamp
 * Returns a timestamp string in the format YYYYMMDDHHMMSS
 * required by the Daraja STK Push API.
 */
const generateTimestamp = () => {
  const now = new Date();
  const year   = now.getFullYear();
  const month  = String(now.getMonth() + 1).padStart(2, '0');
  const day    = String(now.getDate()).padStart(2, '0');
  const hour   = String(now.getHours()).padStart(2, '0');
  const min    = String(now.getMinutes()).padStart(2, '0');
  const sec    = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${min}${sec}`;
};

/**
 * generatePassword
 * Base64 encode: Shortcode + Passkey + Timestamp
 * This is the STK Push password format required by Safaricom.
 */
const generatePassword = (timestamp) => {
  const rawString = `${mpesa.shortCode}${mpesa.passKey}${timestamp}`;
  return Buffer.from(rawString).toString('base64');
};

/**
 * formatPhoneNumber
 * Converts local Kenyan numbers to the required 2547XXXXXXXX format.
 * Examples:
 *   0712345678  → 254712345678
 *   +254712345678 → 254712345678
 *   254712345678  → 254712345678 (already correct)
 */
const formatPhoneNumber = (phone) => {
  const cleaned = String(phone).replace(/\s+/g, '').replace('+', '');
  if (cleaned.startsWith('0')) {
    return `254${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('254')) {
    return cleaned;
  }
  // Assume local number without leading 0
  return `254${cleaned}`;
};

// ─────────────────────────────────────────────────────────────
// 1. GET ACCESS TOKEN
// ─────────────────────────────────────────────────────────────
/**
 * getAccessToken
 * Authenticates with Daraja API using Basic Auth (consumerKey:consumerSecret)
 * Returns a short-lived OAuth2 access token.
 */
const getAccessToken = async () => {
  const credentials = Buffer.from(
    `${mpesa.consumerKey}:${mpesa.consumerSecret}`
  ).toString('base64');

  const url = `${mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await axios.get(url, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  console.log('[M-Pesa] Access token obtained:', response.data.access_token);
  return response.data.access_token;
};

// ─────────────────────────────────────────────────────────────
// 2. INITIATE STK PUSH
// ─────────────────────────────────────────────────────────────
/**
 * initiateSTKPush
 * Sends an STK Push request to the customer's phone number.
 *
 * @param {string} phoneNumber - Customer phone (e.g. 0712345678)
 * @param {number} amount      - Amount in KES (whole number)
 * @param {string} orderId     - Our internal order ID (used as AccountReference)
 * @returns {object} - Daraja API response (includes CheckoutRequestID)
 */
const initiateSTKPush = async (phoneNumber, amount, orderId) => {
  // Step 1: Get fresh access token
  const accessToken = await getAccessToken();

  // Step 2: Prepare request parameters
  const timestamp  = generateTimestamp();
  const password   = generatePassword(timestamp);
  const formattedPhone = formatPhoneNumber(phoneNumber);

  // Step 3: Build request payload
  const payload = {
    BusinessShortCode: mpesa.shortCode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   mpesa.transactionType,
    Amount:            Math.round(amount),          // Must be a whole number
    PartyA:            formattedPhone,              // Customer phone
    PartyB:            mpesa.shortCode,             // Your paybill
    PhoneNumber:       formattedPhone,              // Phone to receive STK push
    CallBackURL:       mpesa.callbackUrl,
    AccountReference:  `StockEase-${orderId}`,      // Shown on customer's phone
    TransactionDesc:   'StockEase Order Payment',
  };

  console.log('[M-Pesa] STK Push payload:', JSON.stringify(payload, null, 2));

  // Step 4: Send request to Daraja
  const url = `${mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`;

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log('[M-Pesa] STK Push response:', response.data);
  return response.data;
};

module.exports = {
  getAccessToken,
  initiateSTKPush,
  formatPhoneNumber,
};
