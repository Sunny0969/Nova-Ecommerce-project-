import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Lock, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPKR } from '../utils/currency';
import { apiMessage } from '../lib/api';
import { walletAPI } from 'api';

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a2e',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: { color: '#b91c1c' }
  },
  hidePostalCode: true
};

export default function WalletTopUpModal({
  isOpen,
  onClose,
  amount,
  onSuccess,
  submitting = false,
  setSubmitting
}) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose, submitting]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handlePay = async () => {
    if (!stripe || !elements) {
      toast.error('Card payment is still loading. Please wait a moment.');
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) {
      toast.error('Enter your card details');
      return;
    }

    setSubmitting(true);
    try {
      const intentRes = await walletAPI.topUpIntent({ amount });
      const intentData = intentRes.data?.data;
      const clientSecret = intentData?.clientSecret;
      const paymentIntentId = intentData?.paymentIntentId;

      if (!clientSecret) {
        throw new Error('Could not start top-up');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      });

      if (error) {
        toast.error(error.message || 'Card payment failed');
        return;
      }

      if (paymentIntent?.status !== 'succeeded') {
        toast.error('Payment was not completed. Please try again.');
        return;
      }

      const confirmRes = await walletAPI.topUpConfirm({
        paymentIntentId: paymentIntentId || paymentIntent.id
      });

      toast.success(confirmRes.data?.message || 'Wallet topped up');
      await onSuccess?.(confirmRes.data?.data);
      onClose?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Top-up failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="stripe-pay-modal" role="presentation">
      <button
        type="button"
        className="stripe-pay-modal__backdrop"
        aria-label="Close"
        onClick={submitting ? undefined : onClose}
      />
      <div
        className="stripe-pay-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-topup-title"
      >
        <div className="stripe-pay-modal__head">
          <div className="stripe-pay-modal__head-icon" aria-hidden>
            <Wallet size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 id="wallet-topup-title" className="stripe-pay-modal__title">
              Top up wallet
            </h2>
            <p className="stripe-pay-modal__subtitle">Add funds to your Bazaar Wallet</p>
          </div>
          <button
            type="button"
            className="stripe-pay-modal__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="stripe-pay-modal__body">
          <div className="stripe-pay-modal__total">
            <span>Amount</span>
            <strong>{formatPKR(amount)}</strong>
          </div>

          <label className="stripe-pay-modal__label" htmlFor="wallet-topup-card">
            Card details
          </label>
          <div id="wallet-topup-card" className="stripe-pay-modal__card-field">
            <CardElement options={CARD_OPTIONS} disabled={submitting} />
          </div>

          <p className="stripe-pay-modal__secure">
            <Lock size={14} strokeWidth={2} aria-hidden />
            Funds are added to your wallet instantly after payment.
          </p>
        </div>

        <div className="stripe-pay-modal__foot">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-gold"
            disabled={submitting || !stripe}
            onClick={handlePay}
          >
            {submitting ? 'Processing…' : `Pay ${formatPKR(amount)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
