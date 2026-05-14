import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import SEO from '../components/SEO';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ShieldCheck } from 'lucide-react';
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

const DEFAULT_SHIPPING_VALUES = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  deliveryOption: 'standard',
  saveAddress: false
};

function splitName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function defaultsFromUser(user) {
  if (!user) return DEFAULT_SHIPPING_VALUES;

  const saved =
    user.savedShippingAddress ||
    (Array.isArray(user.savedAddresses) ? user.savedAddresses.find((addr) => addr?.isDefault) : null) ||
    {};
  const fromName = splitName(user.name);

  return {
    ...DEFAULT_SHIPPING_VALUES,
    firstName: saved.firstName || fromName.firstName,
    lastName: saved.lastName || fromName.lastName,
    email: saved.email || user.email || '',
    phone: saved.phone || user.phone || '',
    street: saved.street || '',
    city: saved.city || '',
    state: saved.state || '',
    zipCode: saved.zipCode || '',
    country: saved.country || ''
  };
}

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

function CheckoutStripeSteps({
  step,
  setStep,
  clientSecret,
  shippingAddress,
  billingSameAsShipping,
  setBillingSameAsShipping,
  cardComplete,
  setCardComplete,
  totals,
  getSubtotal,
  checkoutSummary,
  onPaidSuccess
}) {
  const s = shippingAddress || {};
  return (
    <>
      <div
        id="checkout-step-payment"
        className={step === 2 ? 'checkout-panel' : 'checkout-panel checkout-panel--hidden'}
      >
        <h2 className="checkout-card-title">Payment</h2>
        <p className="checkout-panel__lead">
          Enter your card. You will confirm the full total on the next step before we charge your card.
        </p>
        <div className="checkout-card-element-wrap">
          <label className="form-label" htmlFor="checkout-card-element">
            Card details
          </label>
          <div id="checkout-card-element" className="checkout-card-element">
            <CardElement options={CARD_OPTIONS} onChange={(e) => setCardComplete(e.complete)} />
          </div>
        </div>
        <label className="checkout-checkbox">
          <input
            type="checkbox"
            checked={billingSameAsShipping}
            onChange={(e) => setBillingSameAsShipping(e.target.checked)}
          />
          <span>Billing address same as shipping</span>
        </label>
        <button
          type="button"
          className="btn btn-primary btn-full checkout-step2-next"
          disabled={!cardComplete}
          onClick={() => {
            if (!cardComplete) {
              toast.error('Complete your card details');
              return;
            }
            setStep(3);
          }}
        >
          Continue to review
        </button>
      </div>

      <div
        id="checkout-step-review"
        className={step === 3 ? 'checkout-panel' : 'checkout-panel checkout-panel--hidden'}
      >
        <h2 className="checkout-card-title">Confirm order</h2>
        <p className="checkout-panel__lead">Review your details and place your order. Your card will be charged now.</p>

        <div className="checkout-review-block">
          <h3 className="checkout-review-title">Delivery</h3>
          <p className="checkout-review-text">
            {s.deliveryOption === 'express' && 'Express (1–2 days)'}
            {s.deliveryOption === 'nextday' && 'Next day'}
            {s.deliveryOption === 'standard' && 'Standard (3–5 days)'}
          </p>
        </div>
        <div className="checkout-review-block">
          <h3 className="checkout-review-title">Ship to</h3>
          <p className="checkout-review-text">
            {s.firstName} {s.lastName}
            <br />
            {s.email}
            <br />
            {s.phone}
            <br />
            {s.street}, {s.city}
            {s.state ? `, ${s.state}` : ''} {s.zipCode}
            <br />
            {s.country}
          </p>
        </div>
        <div className="checkout-review-block">
          <h3 className="checkout-review-title">Order total</h3>
          <p className="checkout-review-total">
            {formatPKR(Number(checkoutSummary?.totalPrice ?? totals?.total ?? getSubtotal()))}
          </p>
          <p className="checkout-review-note">
            Includes shipping, tax, and discounts from your delivery choice and store settings.
          </p>
        </div>

        <PlaceOrderButton
          clientSecret={clientSecret}
          shippingAddress={s}
          billingSameAsShipping={billingSameAsShipping}
          onSuccess={onPaidSuccess}
        />
      </div>
    </>
  );
}

export default function Checkout() {
  const { cart, cartState, loading, fetchCart, getSubtotal } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [lockedShipping, setLockedShipping] = useState(null);
  const [publicSettings, setPublicSettings] = useState(null);
  const [creatingPi, setCreatingPi] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [cardComplete, setCardComplete] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(shippingSchema),
    defaultValues: defaultsFromUser(user)
  });

  const deliveryOption = useWatch({ control, name: 'deliveryOption', defaultValue: 'standard' });
  const totals = cartState.totals;

  const discountAmount = useMemo(() => {
    if (totals && Number.isFinite(Number(totals.discountAmount))) {
      return Number(totals.discountAmount);
    }
    return Number(cartState.discountAmount) || 0;
  }, [totals, cartState.discountAmount]);

  useEffect(() => {
    let cancelled = false;

    storeSettingsAPI
      .get()
      .then((res) => {
        if (!cancelled) {
          setPublicSettings(res.data?.data || null);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const storeSettings = user ? cartState.storeSettings || publicSettings : publicSettings;

  const checkoutSummary = useMemo(() => {
    if (user && cartState.pricingPreview) {
      return cartState.pricingPreview;
    }
    if (!storeSettings || !cart.length) return null;
    return computeTotalsPreview(
      getSubtotal(),
      discountAmount,
      deliveryOption || 'standard',
      storeSettings
    );
  }, [user, cartState.pricingPreview, storeSettings, cart.length, getSubtotal, discountAmount, deliveryOption]);

  useEffect(() => {
    reset(defaultsFromUser(user));
  }, [user, reset]);

  useEffect(() => {
    if (step < 2 || step > 3) return;
    window.requestAnimationFrame(() => {
      const id = step === 2 ? 'checkout-step-payment' : 'checkout-step-review';
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [step]);

  const onSubmitShipping = async (data) => {
    if (!cart.length) {
      toast.error('Cart is empty');
      return;
    }

    const shippingAddress = toShippingPayload(data);

    setCreatingPi(true);

    try {
      const res = await ordersAPI.create({
        deliveryOption: data.deliveryOption,
        shippingAddress
      });

      const secret = res.data?.data?.clientSecret;
      if (!secret) {
        toast.error('Payment setup failed');
        return;
      }

      if (user && data.saveAddress) {
        try {
          await authAPI.saveShippingAddress(shippingAddress);
        } catch (err) {
          toast.error(apiMessage(err, 'Could not save address to your account'));
        }
      }

      setLockedShipping({
        ...shippingAddress,
        deliveryOption: data.deliveryOption
      });
      setClientSecret(secret);
      setBillingSameAsShipping(true);
      setCardComplete(false);
      setStep(2);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not prepare checkout'));
    } finally {
      setCreatingPi(false);
    }
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
        {!pk ? (
          <div className="api-error-banner checkout-stripe-banner" role="alert">
            <p>
              <strong>Stripe publishable key missing.</strong> Add{' '}
              <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> to <code>frontend/.env</code> and restart the dev server.
              Until then, payment cannot start after this step.
            </p>
          </div>
        ) : null}

        <div className="checkout-layout checkout-layout--wizard">
          <div className="checkout-main-col">
            {step === 1 && (
              <form
                className="checkout-shipping card-like"
                onSubmit={handleSubmit(onSubmitShipping, () => {
                  toast.error('Please fix the highlighted fields');
                  window.requestAnimationFrame(() => {
                    document.querySelector('.checkout-shipping .form-error')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center'
                    });
                  });
                })}
                noValidate
              >
                <h2 className="checkout-card-title">Step 1 — Shipping address</h2>

                <div className="form-group">
                  <span className="form-label">Delivery speed</span>
                  <div className="delivery-options">
                    {[
                      ['standard', 'Standard (3–5 days)'],
                      ['express', 'Express (1–2 days)'],
                      ['nextday', 'Next day']
                    ].map(([val, label]) => (
                      <label key={val} className="delivery-option-label">
                        <input type="radio" value={val} {...register('deliveryOption')} />
                        {label}
                      </label>
                    ))}
                  </div>
                  {errors.deliveryOption && (
                    <p className="form-error" role="alert">
                      {errors.deliveryOption.message}
                    </p>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-first">
                      First name
                    </label>
                    <input id="ship-first" className="form-control" autoComplete="given-name" {...register('firstName')} />
                    {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-last">
                      Last name
                    </label>
                    <input id="ship-last" className="form-control" autoComplete="family-name" {...register('lastName')} />
                    {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-email">
                    Email
                  </label>
                  <input id="ship-email" type="email" className="form-control" autoComplete="email" {...register('email')} />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-phone">
                    Phone
                  </label>
                  <input id="ship-phone" className="form-control" autoComplete="tel" {...register('phone')} />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-street">
                    Street address
                  </label>
                  <input id="ship-street" className="form-control" autoComplete="street-address" {...register('street')} />
                  {errors.street && <p className="form-error">{errors.street.message}</p>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-city">
                      City
                    </label>
                    <input id="ship-city" className="form-control" autoComplete="address-level2" {...register('city')} />
                    {errors.city && <p className="form-error">{errors.city.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-state">
                      State / County
                    </label>
                    <input id="ship-state" className="form-control" {...register('state')} />
                    {errors.state && <p className="form-error">{errors.state.message}</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-zip">
                      Postcode
                    </label>
                    <input id="ship-zip" className="form-control" autoComplete="postal-code" {...register('zipCode')} />
                    {errors.zipCode && <p className="form-error">{errors.zipCode.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-country">
                      Country
                    </label>
                    <input id="ship-country" className="form-control" autoComplete="country-name" {...register('country')} />
                    {errors.country && <p className="form-error">{errors.country.message}</p>}
                  </div>
                </div>

                {user ? (
                  <label className="checkout-checkbox checkout-checkbox--margin">
                    <input type="checkbox" {...register('saveAddress')} />
                    <span>Save address to my account</span>
                  </label>
                ) : null}

                <button type="submit" className="btn btn-primary btn-full checkout-continue-btn" disabled={creatingPi}>
                  {creatingPi ? 'Preparing checkout…' : 'Continue to payment'}
                </button>

                <p className="checkout-trust">
                  <ShieldCheck size={16} strokeWidth={1.75} className="checkout-trust__icon" aria-hidden />
                  Payments are processed by Stripe. We never store your full card number.
                </p>
              </form>
            )}

            {clientSecret && stripePromise && lockedShipping ? (
              <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
                <CheckoutStripeSteps
                  step={step}
                  setStep={setStep}
                  clientSecret={clientSecret}
                  shippingAddress={lockedShipping}
                  billingSameAsShipping={billingSameAsShipping}
                  setBillingSameAsShipping={setBillingSameAsShipping}
                  cardComplete={cardComplete}
                  setCardComplete={setCardComplete}
                  totals={totals}
                  getSubtotal={getSubtotal}
                  checkoutSummary={checkoutSummary}
                  onSuccess={() => fetchCart()}
                />
              </Elements>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}