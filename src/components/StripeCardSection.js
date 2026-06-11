import React from 'react';
import { CardElement } from '@stripe/react-stripe-js';

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      '::placeholder': { color: '#9ca3af' }
    },
    invalid: { color: '#b91c1c' }
  },
  hidePostalCode: true
};

export default function StripeCardSection({ disabled = false }) {
  return (
    <div className="checkout-stripe-wrap">
      <p className="checkout-panel__lead">Enter your card details below. Payment is processed securely by Stripe.</p>
      <div className="checkout-payment-form">
        <label className="checkout-field-label" htmlFor="stripe-card-element">
          Card number
        </label>
        <div id="stripe-card-element" className="checkout-stripe-card">
          <CardElement options={CARD_OPTIONS} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
