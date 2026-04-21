import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
import { authAPI } from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPKR } from '../utils/currency';
import { computeTotalsPreview } from '../utils/pricing';
import { storeSettingsAPI } from '../api/axios';

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
  firstName: yup.string().trim().required('First name is required').max(80),
  lastName: yup.string().trim().required('Last name is required').max(80),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  phone: yup.string().trim().required('Phone is required').min(7, 'Phone is too short').max(32),
  street: yup.string().trim().required('Street address is required').max(200),
  city: yup.string().trim().required('City is required').max(100),
  state: yup.string().trim().max(100).default(''),
  zipCode: yup.string().trim().required('Postcode is required').max(20),
  country: yup.string().trim().required('Country is required').max(100),
  deliveryOption: yup
    .string()
    .oneOf(['standard', 'express', 'nextday'], 'Select a delivery option')
    .required(),
  saveAddress: yup.boolean().default(false)
});

function countryToStripeCode(country) {
  const c = String(country || '').toLowerCase();
  if (c.includes('united kingdom') || c === 'uk' || c === 'gb' || c.includes('great britain')) return 'GB';
  return 'GB';
}

function defaultsFromUser(user) {
  const s = user?.savedShippingAddress;
  return {
    firstName: s?.firstName || '',
    lastName: s?.lastName || '',
    email: (s?.email || user?.email || '').trim(),
    phone: (s?.phone || user?.phone || '').trim(),
    street: s?.street || '',
    city: s?.city || '',
    state: s?.state || '',
    zipCode: s?.zipCode || '',
    country: s?.country || 'United Kingdom',
    deliveryOption: 'standard',
    saveAddress: false
  };
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

function billingDetailsForStripe(shipping, billingSameAsShipping) {
  const name = `${shipping.firstName} ${shipping.lastName}`.trim();
  const base = {
    email: shipping.email || undefined,
    name: name || undefined,
    phone: shipping.phone || undefined
  };
  if (!billingSameAsShipping) return base;
  return {
    ...base,
    address: {
      line1: shipping.street,
      city: shipping.city,
      state: shipping.state || undefined,
      postal_code: shipping.zipCode,
      country: countryToStripeCode(shipping.country)
    }
  };
}

function CheckoutProgress({ step }) {
  const items = [
    { n: 1, label: 'Shipping' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Confirm' }
  ];
  return (
    <ol className="checkout-wizard-progress" aria-label="Checkout progress">
      {items.map(({ n, label }) => (
        <li
          key={n}
          className={`checkout-wizard-progress__step ${step === n ? 'is-active' : ''} ${step > n ? 'is-done' : ''}`}
        >
          <span className="checkout-wizard-progress__num" aria-hidden>
            {n}
          </span>
          <span className="checkout-wizard-progress__label">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function PlaceOrderButton({ clientSecret, shippingAddress, billingSameAsShipping, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!stripe || !elements) {
      toast.error('Payment form is not ready');
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      toast.error('Card details missing');
      return;
    }
    setBusy(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: billingDetailsForStripe(shippingAddress, billingSameAsShipping)
        }
      });
      if (error) {
        toast.error(error.message || 'Payment failed');
        return;
      }
      if (!paymentIntent?.id || paymentIntent.status !== 'succeeded') {
        toast.error('Payment was not completed');
        return;
      }
      const confirmRes = await axios.post(
        '/api/orders/confirm',
        {
          paymentIntentId: paymentIntent.id,
          shippingAddress: toShippingPayload(shippingAddress)
        },
        { withCredentials: true }
      );
      toast.success('Order placed — thank you!');
      onSuccess();
      const orderId = confirmRes?.data?.data?.order?._id;
      navigate(orderId ? `/order-confirmation/${orderId}` : '/account/orders');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not complete order'));
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
      {busy ? (
        <span className="checkout-place-order__inner">
          <LoadingSpinner size="sm" label="Placing order" className="checkout-place-order__spin" />
          Processing…
        </span>
      ) : (
        'PLACE ORDER'
      )}
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
      <div className={step === 2 ? 'checkout-panel' : 'checkout-panel checkout-panel--hidden'}>
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

      <div className={step === 3 ? 'checkout-panel' : 'checkout-panel checkout-panel--hidden'}>
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, cartState, loading, fetchCart, getSubtotal } = useCart();
  const [step, setStep] = useState(1);
  const [clientSecret, setClientSecret] = useState(null);
  const [creatingPi, setCreatingPi] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [cardComplete, setCardComplete] = useState(false);
  const [lockedShipping, setLockedShipping] = useState(null);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  const totals = cartState.totals;

  useEffect(() => {
    let c = false;
    storeSettingsAPI
      .get()
      .then((r) => {
        if (!c) setStoreSettings(r.data?.data || null);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(shippingSchema),
    defaultValues: defaultsFromUser(null)
  });

  const deliveryOption = useWatch({ control, name: 'deliveryOption', defaultValue: 'standard' });

  const linePreview = useMemo(() => {
    if (!storeSettings || !cart.length) return null;
    return computeTotalsPreview(
      getSubtotal(),
      Number(totals?.discountAmount || 0),
      deliveryOption || 'standard',
      storeSettings
    );
  }, [storeSettings, cart, totals, deliveryOption, getSubtotal]);

  const amountSummary = checkoutSummary || linePreview;

  useEffect(() => {
    reset(defaultsFromUser(user));
  }, [user, reset]);

  const onSubmitShipping = async (data) => {
    if (!cart.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!stripePromise) {
      toast.error('Stripe is not configured. Set REACT_APP_STRIPE_PUBLISHABLE_KEY in .env');
      return;
    }
    if (data.saveAddress) {
      try {
        await authAPI.saveShippingAddress(toShippingPayload(data));
        toast.success('Address saved to your account');
      } catch (e) {
        toast.error(apiMessage(e, 'Could not save address'));
      }
    }
    setCreatingPi(true);
    try {
      const res = await axios.post(
        '/api/stripe/create-payment-intent',
        {
          deliveryOption: data.deliveryOption,
          shippingAddress: toShippingPayload(data)
        },
        { withCredentials: true }
      );
      const secret = res.data?.data?.clientSecret;
      const summary = res.data?.data?.checkoutSummary;
      if (!secret) {
        toast.error(res.data?.message || 'Could not start payment');
        return;
      }
      if (summary && typeof summary === 'object') {
        setCheckoutSummary(summary);
      }
      setLockedShipping({
        ...toShippingPayload(data),
        deliveryOption: data.deliveryOption || 'standard'
      });
      setClientSecret(secret);
      setCardComplete(false);
      setStep(2);
    } catch (err) {
      toast.error(apiMessage(err, 'Payment setup failed'));
    } finally {
      setCreatingPi(false);
    }
  };

  const handlePaidSuccess = () => {
    fetchCart();
  };

  if (loading) {
    return (
      <main className="section container checkout-page checkout-page--loading" id="main-content">
        <SEO
          noIndex
          title="Checkout"
          description="Loading secure checkout. Complete your Nova Shop order in a few steps."
          canonicalUrl="/checkout"
        />
        <LoadingSpinner size="lg" label="Loading checkout" />
        <p className="checkout-loading-note">Loading your cart…</p>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="section container text-center checkout-page checkout-page--empty" id="main-content">
        <SEO
          noIndex
          title="Checkout"
          description="Your Nova Shop cart is empty. Continue shopping, then return to checkout."
          canonicalUrl="/checkout"
        />
        <h1 className="checkout-empty-title">Your cart is empty</h1>
        <p className="checkout-empty-lead">Add something you love before checking out.</p>
        <Link to="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
        <p className="checkout-empty-cart-link">
          <Link to="/cart">View cart</Link>
        </p>
      </main>
    );
  }

  return (
    <>
      <SEO
        noIndex
        title="Checkout"
        description="Complete your Nova Shop order — shipping, payment, and confirmation in three simple steps."
        canonicalUrl="/checkout"
      />
      <header className="page-header checkout-page-header">
        <div className="container">
          <h1 className="page-header__title">Checkout</h1>
          <p className="page-header__subtitle">Shipping, payment, then confirm your order.</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/cart">Cart</Link>
            </li>
            <li className="active" aria-current="page">
              Checkout
            </li>
          </ol>
        </div>
      </header>

      <main className="section checkout-page" id="main-content">
        <div className="container">
          <CheckoutProgress step={step} />

        {!pk && (
          <div className="api-error-banner" role="alert">
            <p>
              <strong>Stripe publishable key missing.</strong> Add{' '}
              <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> to <code>frontend/.env</code> and restart the dev server.
            </p>
          </div>
        )}

        <div className="checkout-layout checkout-layout--wizard">
          <div className="checkout-main-col">
            {step === 1 && (
              <form className="checkout-shipping card-like" onSubmit={handleSubmit(onSubmitShipping)} noValidate>
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

                <button type="submit" className="btn btn-primary btn-full checkout-continue-btn" disabled={creatingPi || !pk}>
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
                  onPaidSuccess={handlePaidSuccess}
                />
              </Elements>
            ) : null}

            {step > 1 && (
              <button type="button" className="btn btn-outline btn-sm checkout-back" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                ← Back
              </button>
            )}
          </div>

          <aside className="checkout-summary card-like checkout-summary--sticky">
            <h2 className="checkout-card-title">Order summary</h2>
            <ul className="checkout-lines">
              {cart.map((line) => (
                <li key={line.product?._id || line.product}>
                  <span>
                    {line.product?.name} × {line.quantity}
                  </span>
                  <span>{formatPKR(Number(line.lineTotal ?? (line.price || 0) * (line.quantity || 0)))}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPKR(getSubtotal())}</span>
            </div>
            {totals && (
              <div className="summary-row">
                <span>Discount</span>
                <span className="checkout-summary__discount">−{formatPKR(Number(totals.discountAmount || 0))}</span>
              </div>
            )}
            {amountSummary ? (
              <>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>
                    {amountSummary.shippingPrice === 0 ? (
                      <span className="cart-summary__free">Free</span>
                    ) : (
                      formatPKR(amountSummary.shippingPrice)
                    )}
                  </span>
                </div>
                {Number(amountSummary.taxPrice) > 0 ? (
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatPKR(amountSummary.taxPrice)}</span>
                  </div>
                ) : null}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPKR(amountSummary.totalPrice)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-600">Loading totals…</p>
            )}
            <button type="button" className="btn btn-outline btn-sm checkout-edit-cart" onClick={() => navigate('/cart')}>
              Edit cart
            </button>
            <p className="checkout-summary__lock">
              <Lock size={14} strokeWidth={1.75} aria-hidden />
              Encrypted checkout
            </p>
          </aside>
        </div>
        </div>
      </main>
    </>
  );
}
