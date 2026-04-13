// ============================================================
// PaymentModal.jsx
// M-Pesa STK Push payment modal.
//
// Flow:
//   1. User enters phone number and clicks "Pay Now"
//   2. STK Push is sent → status becomes "Pending"
//   3. Every 4 seconds, poll backend for payment status
//   4. When status → "Success" or "Failed", stop polling
//      and show result
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { paymentService } from '../services/paymentService';

// ── Phone number formatter ─────────────────────────────────
// Accepts: 0712345678 | +254712345678 | 254712345678
// Returns: 254712345678
const formatPhone = (phone) => {
  const clean = String(phone).replace(/\s+/g, '').replace('+', '');
  if (clean.startsWith('0')) return `254${clean.slice(1)}`;
  if (clean.startsWith('254')) return clean;
  return `254${clean}`;
};

// ── Step labels ────────────────────────────────────────────
const STEP = {
  INPUT:      'input',      // Phone entry form
  PROCESSING: 'processing', // Waiting for Daraja response
  POLLING:    'polling',    // Waiting for M-Pesa callback
  SUCCESS:    'success',    // Payment confirmed
  FAILED:     'failed',     // Payment failed / cancelled
};

const PaymentModal = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [phone, setPhone]       = useState('');
  const [step, setStep]         = useState(STEP.INPUT);
  const [errorMsg, setErrorMsg] = useState('');
  const [receipt, setReceipt]   = useState('');

  // ref so the polling interval can be cleared from inside async callbacks
  const pollRef = useRef(null);

  // ── Reset state when modal is opened/closed ──────────────
  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setStep(STEP.INPUT);
      setErrorMsg('');
      setReceipt('');
    } else {
      stopPolling();
    }
  }, [isOpen]);

  // ── Cleanup interval on unmount ───────────────────────────
  useEffect(() => () => stopPolling(), []);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // ── Start polling payment status every 4 seconds ─────────
  const startPolling = (orderId) => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await paymentService.getStatus(orderId);
        const status = data?.payment?.status;

        if (status === 'Success') {
          stopPolling();
          setReceipt(data.payment.mpesaReceiptNumber || '');
          setStep(STEP.SUCCESS);
          onPaymentSuccess(orderId); // notify parent to refresh order list
        } else if (status === 'Failed') {
          stopPolling();
          setStep(STEP.FAILED);
        }
        // If still 'Pending', keep polling
      } catch {
        // Ignore transient network errors during polling
      }
    }, 4000); // poll every 4 seconds
  };

  // ── Handle Pay button click ───────────────────────────────
  const handlePay = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Basic phone validation
    const trimmed = phone.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a phone number.');
      return;
    }

    const formatted = formatPhone(trimmed);
    // Kenyan numbers are 12 digits after formatting (254XXXXXXXXX)
    if (!/^2547\d{8}$/.test(formatted)) {
      setErrorMsg('Enter a valid Safaricom number e.g. 0712 345 678');
      return;
    }

    setStep(STEP.PROCESSING);

    try {
      await paymentService.stkPush(formatted, order.totalAmount, order._id);

      // STK Push sent — now wait for callback via polling
      setStep(STEP.POLLING);
      startPolling(order._id);
    } catch (err) {
      const msg =
        err.response?.data?.error?.errorMessage ||
        err.response?.data?.message ||
        'Failed to send STK Push. Check your credentials and try again.';
      setErrorMsg(msg);
      setStep(STEP.INPUT);
    }
  };

  // ── Render helpers ────────────────────────────────────────
  const renderInput = () => (
    <form onSubmit={handlePay} className="space-y-5">
      {/* Order summary */}
      <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-1">
        <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">
          Order to Pay
        </p>
        <p className="text-gray-800 font-semibold">{order?.orderNumber}</p>
        <p className="text-blue-700 text-lg font-bold">
          Ksh {Math.round(order?.totalAmount || 0).toLocaleString()}
        </p>
      </div>

      {/* Phone input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          M-Pesa Phone Number
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
          <span className="bg-gray-100 px-3 py-2.5 text-gray-500 text-sm border-r border-gray-300 flex items-center gap-1.5">
            <Smartphone size={14} /> 254
          </span>
          <input
            type="tel"
            placeholder="7XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
            maxLength={12}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Sandbox test: use 254708374149
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onClose} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Smartphone size={15} /> Send STK Push
        </button>
      </div>
    </form>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center py-8 gap-4 text-center">
      <Loader2 size={40} className="text-blue-500 animate-spin" />
      <p className="text-gray-700 font-medium">Sending STK Push...</p>
      <p className="text-gray-400 text-sm">Please wait</p>
    </div>
  );

  const renderPolling = () => (
    <div className="flex flex-col items-center py-8 gap-4 text-center">
      <Loader2 size={40} className="text-green-500 animate-spin" />
      <p className="text-gray-800 font-semibold text-lg">Check your phone!</p>
      <p className="text-gray-500 text-sm max-w-xs">
        An M-Pesa prompt has been sent to your phone. Enter your PIN to
        complete the payment.
      </p>
      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-yellow-700 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Waiting for confirmation...
      </div>
      <button
        onClick={() => { stopPolling(); setStep(STEP.INPUT); }}
        className="text-xs text-gray-400 hover:text-gray-600 underline mt-2"
      >
        Cancel and try again
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center py-8 gap-4 text-center">
      <CheckCircle2 size={56} className="text-green-500" />
      <p className="text-gray-800 font-bold text-xl">Payment Successful!</p>
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 space-y-1 text-sm">
        <p className="text-gray-500">Order: <span className="font-semibold text-gray-700">{order?.orderNumber}</span></p>
        <p className="text-gray-500">Amount: <span className="font-semibold text-green-700">Ksh {Math.round(order?.totalAmount || 0).toLocaleString()}</span></p>
        {receipt && (
          <p className="text-gray-500">Receipt: <span className="font-semibold text-gray-700">{receipt}</span></p>
        )}
      </div>
      <button onClick={onClose} className="btn-primary mt-2">
        Done
      </button>
    </div>
  );

  const renderFailed = () => (
    <div className="flex flex-col items-center py-8 gap-4 text-center">
      <XCircle size={56} className="text-red-500" />
      <p className="text-gray-800 font-bold text-xl">Payment Failed</p>
      <p className="text-gray-500 text-sm max-w-xs">
        The transaction was cancelled or declined. You can try again.
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={onClose} className="btn-secondary">Close</button>
        <button
          onClick={() => { setStep(STEP.INPUT); setErrorMsg(''); }}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const stepContent = {
    [STEP.INPUT]:      renderInput,
    [STEP.PROCESSING]: renderProcessing,
    [STEP.POLLING]:    renderPolling,
    [STEP.SUCCESS]:    renderSuccess,
    [STEP.FAILED]:     renderFailed,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === STEP.INPUT || step === STEP.SUCCESS || step === STEP.FAILED ? onClose : undefined}
      title={step === STEP.INPUT ? 'Pay with M-Pesa' : ''}
    >
      {order && (stepContent[step] || renderInput)()}
    </Modal>
  );
};

export default PaymentModal;
