import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { X, Lock, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPKR } from '../utils/currency';
import { apiMessage } from '../lib/api';
import { ordersAPI } from '../api/orders';
import { stripeAPI } from '../api/stripe';

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

export default function StripePaymentModal({
  isOpen,
  onClose,
  orderTotal,
  lockedShipping,
  getShippingAddress,
  isGuestCheckout = false,
  useGuestStripeApi = false,
  guestItems = [],
  guestCouponCode = '',
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

  const shouldUseGuestStripe = () =>
    Boolean(guestItems?.length) ||
    useGuestStripeApi ||
    isGuestCheckout ||
    !localStorage.getItem('nova_shop_token');

  const handlePay = async () => {
    if (!lockedShipping) return;
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
      const shippingAddress = getShippingAddress();
      const payload = {
        deliveryOption: lockedShipping.deliveryOption,
        shippingAddress
      };

      const payWithGuestStripe = shouldUseGuestStripe();
      let usedGuestStripe = payWithGuestStripe;

      let intentRes;
      try {
        const guestPayload = {
          ...payload,
          items: guestItems,
          couponCode: guestCouponCode || undefined
        };
        intentRes = payWithGuestStripe
          ? await stripeAPI.guestCreatePaymentIntent(guestPayload)
          : await stripeAPI.createPaymentIntent(payload);
      } catch (intentErr) {
        if (
          intentErr.response?.status === 401 &&
          !payWithGuestStripe &&
          guestItems.length
        ) {
          usedGuestStripe = true;
          intentRes = await stripeAPI.guestCreatePaymentIntent({
            ...payload,
            items: guestItems,
            couponCode: guestCouponCode || undefined
          });
        } else {
          throw intentErr;
        }
      }

      const intentData = intentRes.data?.data;
      const clientSecret = intentData?.clientSecret;
      const paymentIntentId = intentData?.paymentIntentId;

      if (!clientSecret) {
        throw new Error('Could not start card payment');
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

      const confirmRes = usedGuestStripe
        ? await stripeAPI.guestConfirm({
            paymentIntentId: paymentIntentId || paymentIntent.id,
            deliveryOption: lockedShipping.deliveryOption,
            shippingAddress,
            items: guestItems,
            couponCode: guestCouponCode || undefined
          })
        : await ordersAPI.confirm({
            paymentIntentId: paymentIntentId || paymentIntent.id,
            shippingAddress
          });

      await onSuccess(confirmRes);
      onClose?.();
    } catch (err) {
      toast.error(apiMessage(err, 'Card payment failed'));
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
        aria-labelledby="stripe-pay-title"
      >
        <div className="stripe-pay-modal__head">
          <div className="stripe-pay-modal__head-icon" aria-hidden>
            <CreditCard size={22} strokeWidth={1.75} />
          </div>
          <div>
            <h2 id="stripe-pay-title" className="stripe-pay-modal__title">
              Pay with card
            </h2>
            <p className="stripe-pay-modal__subtitle">Secure payment powered by Stripe</p>
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
            <span>Order total</span>
            <strong>{formatPKR(orderTotal)}</strong>
          </div>

          <label className="stripe-pay-modal__label" htmlFor="stripe-modal-card">
            Card details
          </label>
          <div id="stripe-modal-card" className="stripe-pay-modal__card-field">
            <CardElement options={CARD_OPTIONS} disabled={submitting} />
          </div>

          <p className="stripe-pay-modal__secure">
            <Lock size={14} strokeWidth={2} aria-hidden />
            Your payment information is encrypted and never stored on our servers.
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
            {submitting ? 'Processing…' : `Pay ${formatPKR(orderTotal)}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
