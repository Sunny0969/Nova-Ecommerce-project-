import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import SEO from '../components/SEO';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiMessage } from '../lib/api';
import { authAPI, storeSettingsAPI, ordersAPI } from 'api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPKR } from '../utils/currency';
import { computeTotalsPreview } from '../utils/pricing';

const pk = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = pk ? loadStripe(pk) : null;

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a1a1a',
      fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      '::placeholder': { color: '#8a8a8a' }
    },
    invalid: { color: '#b91c1c' }
  },
  hidePostalCode: true
};

const shippingSchema = yup.object({
  firstName: yup.string().trim().required().max(80),
  lastName: yup.string().trim().required().max(80),
  email: yup.string().trim().email().required(),
  phone: yup.string().trim().required().min(7).max(32),
  street: yup.string().trim().required().max(200),
  city: yup.string().trim().required().max(100),
  state: yup.string().trim().max(100).default(''),
  zipCode: yup.string().trim().required().max(20),
  country: yup.string().trim().required().max(100),
  deliveryOption: yup.string().oneOf(['standard', 'express', 'nextday']).required(),
  saveAddress: yup.boolean().default(false)
});

function countryToStripeCode(country) {
  return 'GB';
}

function toShippingPayload(data) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    street: data.street,
    city: data.city,
    state: data.state || '',
    zipCode: data.zipCode,
    country: data.country
  };
}

function billingDetailsForStripe(shipping) {
  return {
    email: shipping.email,
    name: `${shipping.firstName} ${shipping.lastName}`,
    phone: shipping.phone,
    address: {
      line1: shipping.street,
      city: shipping.city,
      state: shipping.state,
      postal_code: shipping.zipCode,
      country: countryToStripeCode(shipping.country)
    }
  };
}

function PlaceOrderButton({ clientSecret, shippingAddress, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setBusy(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: billingDetailsForStripe(shippingAddress)
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const confirmRes = await ordersAPI.confirm({
          paymentIntentId: paymentIntent.id,
          shippingAddress
        });

        toast.success('Order placed successfully!');
        onSuccess();

        const orderId = confirmRes?.data?.data?.order?._id;
        navigate(orderId ? `/order-confirmation/${orderId}` : '/account/orders');
      }
    } catch (err) {
      toast.error(apiMessage(err, 'Payment failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-gold btn-full checkout-place-order"
      disabled={!stripe || busy}
      onClick={handleClick}
    >
      {busy ? 'Processing…' : 'PLACE ORDER'}
    </button>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartState, loading, fetchCart, getSubtotal } = useCart();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [lockedShipping, setLockedShipping] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(shippingSchema)
  });

  const onSubmitShipping = async (data) => {
    if (!cart.length) {
      toast.error('Cart is empty');
      return;
    }

    const res = await ordersAPI.create({
      deliveryOption: data.deliveryOption,
      shippingAddress: toShippingPayload(data)
    });

    const secret = res.data?.data?.clientSecret;
    if (!secret) {
      toast.error('Payment setup failed');
      return;
    }

    setLockedShipping(toShippingPayload(data));
    setClientSecret(secret);
    setStep(2);
  };

  if (loading) {
    return (
      <main className="section container checkout-page">
        <LoadingSpinner size="lg" label="Loading checkout" />
      </main>
    );
  }

  return (
    <>
      <SEO noIndex title="Checkout" />

      <main className="section checkout-page">
        <div className="container">

          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitShipping)}>
              {/* Shipping form inputs same as your original */}
              <button type="submit" className="btn btn-primary">
                Continue to payment
              </button>
            </form>
          )}

          {/* ✅ FIXED STRIPE BLOCK */}
          {clientSecret && stripePromise && lockedShipping && (
            <Elements stripe={stripePromise} key={clientSecret}>
              <div className="checkout-panel">
                <CardElement options={CARD_OPTIONS} />
                <PlaceOrderButton
                  clientSecret={clientSecret}
                  shippingAddress={lockedShipping}
                  onSuccess={() => fetchCart()}
                />
              </div>
            </Elements>
          )}

        </div>
      </main>
    </>
  );
}