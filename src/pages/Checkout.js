import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { productImageUrl } from '../lib/productImage';
import ProductImage from '../components/ProductImage';
import { buildProductImageAlt } from '../utils/imageAlt';
import SEO from '../components/SEO';
import { yupResolver } from '@hookform/resolvers/yup';
import { boolean, object, string } from 'yup';
import { ShieldCheck, Banknote, CreditCard, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiMessage } from '../lib/api';
import { authAPI, ordersAPI, publicAPI, walletAPI } from 'api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPKR } from '../utils/currency';
import { buildProductPath, getProductCategorySlug } from '../utils/urls';
import { trackInitiateCheckout } from '../lib/metaPixel';
import { computeTotalsPreview, computeCartWeightKg, calculateShipping } from '../utils/pricing';
import { getPaymentOptions } from '../config/payments';
import StripePaymentModal from '../components/StripePaymentModal';
import PakistanLocationFields from '../components/checkout/PakistanLocationFields';
import { normalizeProvinceName } from '../data/pakistanLocations';
import { useStoreSettings } from '../hooks/useStoreSettings';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Keep only digits, optionally capped. */
function digitsOnly(value, maxLen) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return maxLen != null ? digits.slice(0, maxLen) : digits;
}

function shippingSummaryLabel(option) {
  if (option === 'express') return 'Shipping (express)';
  if (option === 'nextday') return 'Shipping (next day)';
  return 'Shipping (standard)';
}

function PaymentOptionIcon({ id }) {
  if (id === 'cod') return <Banknote size={22} />;
  return <CreditCard size={22} />;
}

function paymentReviewLabel(method, payTotal, walletPreview) {
  const walletUsed = Number(walletPreview?.walletAmountUsed) || 0;
  if (walletUsed > 0 && payTotal <= 0) {
    return (
      <>
        Bazaar Wallet — {formatPKR(walletUsed)} paid from your wallet balance.
      </>
    );
  }
  if (walletUsed > 0) {
    const walletPart = `${formatPKR(walletUsed)} from wallet + `;
    if (method === 'stripe') {
      return (
        <>
          {walletPart}pay {formatPKR(payTotal)} by card (Stripe).
        </>
      );
    }
    return (
      <>
        {walletPart}pay {formatPKR(payTotal)} on delivery (cash).
      </>
    );
  }
  if (method === 'stripe') {
    return <>Credit / debit card (Stripe) — {formatPKR(payTotal)} charged securely online.</>;
  }
  return <>Cash on delivery — pay {formatPKR(payTotal)} when your order arrives.</>;
}

const shippingSchema = object({
  firstName: string().trim().required().max(80),
  lastName: string().trim().required().max(80),
  email: string().trim().email().required(),
  phone: string()
    .trim()
    .required('Phone number is required')
    .matches(/^\d+$/, 'Phone must contain numbers only')
    .min(10, 'Enter at least 10 digits')
    .max(15, 'Phone number is too long'),
  street: string().trim().required().max(200),
  city: string().trim().required('Please select a city').max(100),
  state: string().trim().required('Please select a province').max(100),
  zipCode: string()
    .trim()
    .required('Postcode is required')
    .matches(/^\d{5}$/, 'Enter a valid 5-digit postcode'),
  country: string().trim().required().max(100),
  deliveryOption: string().oneOf(['standard', 'express', 'nextday']).required(),
  saveAddress: boolean().default(false)
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
  country: 'Pakistan',
  deliveryOption: 'standard',
  saveAddress: false
};

function splitName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
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
    phone: digitsOnly(saved.phone || user.phone || '', 15),
    street: saved.street || '',
    city: saved.city || '',
    state: normalizeProvinceName(saved.state || ''),
    zipCode: digitsOnly(saved.zipCode || '', 5),
    country: saved.country || 'Pakistan'
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

function deliveryLabel(option) {
  if (option === 'express') return 'Express (1–2 days)';
  if (option === 'nextday') return 'Next day';
  return 'Standard (3–5 days)';
}

function guestCartPayload(cartLines) {
  return (cartLines || [])
    .map((line) => ({
      productId: line.product?._id || line.product,
      quantity: Number(line.quantity) || 1,
      price: line.price != null ? Number(line.price) : undefined
    }))
    .filter((line) => line.productId);
}

export default function Checkout() {
  const [stripeKey, setStripeKey] = useState('');
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    publicAPI
      .getStripeConfig()
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (data?.configured && data?.publishableKey) {
          setStripeKey(String(data.publishableKey).trim());
        } else {
          setStripeKey('');
        }
      })
      .catch(() => {
        if (!cancelled) setStripeKey('');
      })
      .finally(() => {
        if (!cancelled) setStripeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stripePromise = useMemo(
    () => (stripeKey ? loadStripe(stripeKey) : null),
    [stripeKey]
  );

  if (!stripeReady) {
    return (
      <div className="section checkout-page">
        <LoadingSpinner size="lg" label="Loading checkout" />
      </div>
    );
  }

  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutFlow stripeEnabled />
      </Elements>
    );
  }
  return <CheckoutFlow stripeEnabled={false} />;
}

function CheckoutFlow({ stripeEnabled }) {
  const navigate = useNavigate();
  const { cart, cartState, loading, fetchCart, getSubtotal, clearCart } = useCart();
  const { user, canAccessCustomerApp, loading: authLoading, token, checkAuth } = useAuth();
  const isLoggedInCustomer = Boolean(user && canAccessCustomerApp && token);
  const isGuestCheckout = !isLoggedInCustomer;
  const useGuestStripeApi =
    isGuestCheckout || !token || !localStorage.getItem('nova_shop_token');
  const [step, setStep] = useState(1);
  const [lockedShipping, setLockedShipping] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [useWallet, setUseWallet] = useState(false);
  const [walletPreview, setWalletPreview] = useState(null);
  const placeLockRef = useRef(false);
  const { settings: storeSettings, loading: settingsLoading } = useStoreSettings();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(shippingSchema),
    defaultValues: defaultsFromUser(user)
  });

  const deliveryOption = useWatch({ control, name: 'deliveryOption', defaultValue: 'standard' });
  const activeDelivery = lockedShipping?.deliveryOption ?? deliveryOption ?? 'standard';
  const totals = cartState.totals;
  const subtotal = getSubtotal();

  const discountAmount = useMemo(() => {
    if (totals && Number.isFinite(Number(totals.discountAmount))) {
      return Number(totals.discountAmount);
    }
    return Number(cartState.discountAmount) || 0;
  }, [totals, cartState.discountAmount]);

  useEffect(() => {
    reset(defaultsFromUser(isLoggedInCustomer ? user : null));
  }, [user, isLoggedInCustomer, reset]);

  const cartWeightKg = useMemo(() => {
    if (!storeSettings || !cart.length) return null;
    return computeCartWeightKg(cart, storeSettings);
  }, [cart, storeSettings]);

  const deliveryOptions = useMemo(() => {
    const base = [
      ['standard', 'Standard (3–5 days)'],
      ['express', 'Express (1–2 days)'],
      ['nextday', 'Next day']
    ];
    if (!storeSettings) return base;
    return base.map(([val, label]) => {
      const price = calculateShipping(subtotal, val, storeSettings, cartWeightKg);
      return [val, `${label} — ${formatPKR(price)}`];
    });
  }, [storeSettings, subtotal, cartWeightKg]);

  const checkoutSummary = useMemo(() => {
    if (!storeSettings || !cart.length) return null;
    return computeTotalsPreview(subtotal, discountAmount, activeDelivery, storeSettings, cartWeightKg);
  }, [storeSettings, cart.length, subtotal, discountAmount, activeDelivery, cartWeightKg]);

  const orderTotal = Number(checkoutSummary?.totalPrice ?? totals?.total ?? subtotal);
  const payTotal = Number(walletPreview?.totalAfterWallet ?? orderTotal);
  const walletAmountUsed = Number(walletPreview?.walletAmountUsed) || 0;
  const walletBalance = Number(walletPreview?.balance ?? user?.walletBalance) || 0;
  const itemCount = cart.reduce((n, line) => n + (Number(line.quantity) || 0), 0);
  const paymentOptions = useMemo(
    () => getPaymentOptions({ includeStripe: stripeEnabled }),
    [stripeEnabled]
  );

  const openStripeModal = () => {
    if (!stripeEnabled) {
      toast.error('Card payment is not available right now.');
      return;
    }
    setStripeModalOpen(true);
  };

  const handlePaymentMethodChange = (methodId) => {
    setPaymentMethod(methodId);
    if (methodId === 'stripe') {
      setUseWallet(false);
      openStripeModal();
    }
  };

  useEffect(() => {
    if (!isLoggedInCustomer || !checkoutSummary?.totalPrice) {
      setWalletPreview(null);
      return undefined;
    }
    let cancelled = false;
    walletAPI
      .preview({ totalPrice: checkoutSummary.totalPrice, useWallet })
      .then((res) => {
        if (!cancelled) setWalletPreview(res.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setWalletPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedInCustomer, checkoutSummary?.totalPrice, useWallet]);

  const initiateCheckoutTracked = useRef(false);

  useEffect(() => {
    if (step < 2 || !checkoutSummary || initiateCheckoutTracked.current) return;
    initiateCheckoutTracked.current = true;
    const shipping = lockedShipping || {};
    const itemCount = cart.reduce((n, line) => n + (Number(line.quantity) || 0), 0);
    trackInitiateCheckout({
      value: payTotal,
      numItems: itemCount,
      email: shipping.email || user?.email,
      phone: shipping.phone || user?.phone,
      cart
    });
  }, [step, checkoutSummary, payTotal, cart, lockedShipping, user]);

  useEffect(() => {
    reset(defaultsFromUser(isLoggedInCustomer ? user : null));
  }, [user, isLoggedInCustomer, reset]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

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
    setStep(2);
  };

  const placeOrderPayload = (extra = {}) => ({
    deliveryOption: lockedShipping.deliveryOption,
    shippingAddress: {
      firstName: lockedShipping.firstName,
      lastName: lockedShipping.lastName,
      email: lockedShipping.email,
      phone: lockedShipping.phone,
      street: lockedShipping.street,
      city: lockedShipping.city,
      state: lockedShipping.state,
      zipCode: lockedShipping.zipCode,
      country: lockedShipping.country
    },
    paymentMethod,
    useWallet: isLoggedInCustomer && useWallet && paymentMethod !== 'stripe',
    ...extra
  });

  const finalizePlacement = (res, { guest = false } = {}) => {
    toast.success('Order placed successfully!');
    const order = res.data?.data?.order;
    const orderId = order?._id;
    if (orderId) {
      navigate(`/order-confirmation/${orderId}`, {
        state: guest && order ? { guestOrder: order } : undefined
      });
    } else {
      navigate(isLoggedInCustomer ? '/account/orders' : '/home');
    }
    if (guest) {
      void clearCart();
    } else {
      void fetchCart();
    }
    if (isLoggedInCustomer) {
      void checkAuth();
    }
  };

  const handlePlaceOrder = () => {
    if (!lockedShipping) return;
    if (placeLockRef.current || placing) return;
    if (paymentMethod === 'stripe') {
      openStripeModal();
      return;
    }
    if (!paymentMethod) {
      toast.error('Choose a payment method');
      return;
    }

    placeLockRef.current = true;
    setPlacing(true);
    const placeRequest = isGuestCheckout
      ? ordersAPI.guestPlace({
          ...placeOrderPayload(),
          items: guestCartPayload(cart)
        })
      : ordersAPI.place(placeOrderPayload());

    placeRequest
      .then((res) => finalizePlacement(res, { guest: isGuestCheckout }))
      .catch((err) => toast.error(apiMessage(err, 'Could not place order')))
      .finally(() => {
        placeLockRef.current = false;
        setPlacing(false);
      });
  };

  if (loading || authLoading) {
    return (
      <div className="section container checkout-page">
        <LoadingSpinner size="lg" label="Loading checkout" />
      </div>
    );
  }

  const s = lockedShipping || {};

  return (
    <>
      {stripeEnabled ? (
        <StripePaymentModal
          isOpen={stripeModalOpen}
          onClose={() => !placing && setStripeModalOpen(false)}
          orderTotal={payTotal}
          lockedShipping={lockedShipping}
          getShippingAddress={() => placeOrderPayload().shippingAddress}
          isGuestCheckout={isGuestCheckout}
          useGuestStripeApi={useGuestStripeApi}
          guestItems={guestCartPayload(cart)}
          onSuccess={(res) => finalizePlacement(res, { guest: isGuestCheckout })}
          submitting={placing}
          setSubmitting={setPlacing}
        />
      ) : null}

      <SEO noIndex title="Checkout" />

      <div className="section checkout-page">
        <div className="container">
          <h1 className="checkout-page__title">Secure Checkout</h1>
          {!isLoggedInCustomer ? (
            <p className="checkout-guest-banner">
              Checking out as a guest — no account needed. Already have an account?{' '}
              <Link to="/login?next=/checkout">Sign in</Link> for saved addresses and order history.
            </p>
          ) : null}
          <div className="checkout-layout checkout-layout--wizard">
            <div className="checkout-main-col">
            {step === 1 && (
              <form
                className="checkout-shipping card-like"
                onSubmit={handleSubmit(onSubmitShipping, () => {
                  toast.error('Please fix the highlighted fields');
                })}
                noValidate
              >
                <h2 className="checkout-card-title">Step 1 — Shipping address</h2>

                <div className="form-group">
                  <span className="form-label">Delivery speed</span>
                  <div className="delivery-options">
                    {deliveryOptions.map(([val, label]) => (
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
                  <input
                    id="ship-phone"
                    className="form-control"
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={15}
                    placeholder="03001234567"
                    {...register('phone', {
                      onChange: (e) => {
                        e.target.value = digitsOnly(e.target.value, 15);
                      }
                    })}
                  />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                  <p className="checkout-location-hint">Numbers only — e.g. 03001234567</p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="ship-street">
                    Street address
                  </label>
                  <input id="ship-street" className="form-control" autoComplete="street-address" {...register('street')} />
                  {errors.street && <p className="form-error">{errors.street.message}</p>}
                </div>

                <PakistanLocationFields control={control} setValue={setValue} errors={errors} />

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-zip">
                      Postcode
                    </label>
                    <input
                      id="ship-zip"
                      className="form-control"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="54000"
                      pattern="\d{5}"
                      {...register('zipCode', {
                        onChange: (e) => {
                          e.target.value = digitsOnly(e.target.value, 5);
                        }
                      })}
                    />
                    {errors.zipCode && <p className="form-error">{errors.zipCode.message}</p>}
                    <p className="checkout-location-hint">5 digits only (numbers, no letters).</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ship-country">
                      Country
                    </label>
                    <input
                      id="ship-country"
                      className="form-control checkout-country-field"
                      autoComplete="country-name"
                      readOnly
                      {...register('country')}
                    />
                    {errors.country && <p className="form-error">{errors.country.message}</p>}
                  </div>
                </div>

                {user ? (
                  <label className="checkout-checkbox checkout-checkbox--margin">
                    <input type="checkbox" {...register('saveAddress')} />
                    <span>Save address to my account</span>
                  </label>
                ) : null}

                <button type="submit" className="btn btn-primary btn-full checkout-continue-btn">
                  Continue to payment
                </button>

                <p className="checkout-trust">
                  <ShieldCheck size={16} strokeWidth={1.75} className="checkout-trust__icon" aria-hidden />
                  Secure checkout — cash on delivery or pay securely by card via Stripe.
                </p>
              </form>
            )}

            {step >= 2 && lockedShipping ? (
              <>
                <div
                  id="checkout-step-payment"
                  className={step === 2 ? 'checkout-panel card-like' : 'checkout-panel card-like checkout-panel--hidden'}
                >
                  <h2 className="checkout-card-title">Step 2 — Payment method</h2>
                  <p className="checkout-panel__lead">
                    Choose cash on delivery{stripeEnabled ? ' or pay securely by card.' : '.'}
                  </p>

                  <div className="checkout-payment-methods" role="radiogroup" aria-label="Payment method">
                    {paymentOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`checkout-payment-option${paymentMethod === opt.id ? ' is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.id}
                          checked={paymentMethod === opt.id}
                          onChange={() => handlePaymentMethodChange(opt.id)}
                        />
                        <span className="checkout-payment-option__icon" aria-hidden>
                          <PaymentOptionIcon id={opt.id} />
                        </span>
                        <span className="checkout-payment-option__body">
                          <span className="checkout-payment-option__label">{opt.label}</span>
                          <span className="checkout-payment-option__desc">{opt.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'stripe' && stripeEnabled ? (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm checkout-stripe-open"
                      onClick={openStripeModal}
                    >
                      Enter card details
                    </button>
                  ) : null}

                  {isLoggedInCustomer ? (
                    <div className="checkout-wallet">
                      {paymentMethod === 'stripe' ? (
                        <p className="checkout-wallet__hint">
                          Wallet balance can be used with cash on delivery. Switch payment method to
                          apply your wallet.
                        </p>
                      ) : walletBalance > 0 ? (
                        <label className="checkout-wallet__toggle">
                          <input
                            type="checkbox"
                            checked={useWallet}
                            onChange={(e) => setUseWallet(e.target.checked)}
                          />
                          <span>
                            <span className="checkout-wallet__title">
                              Use Bazaar Wallet
                            </span>
                            <span className="checkout-wallet__meta">
                              {formatPKR(walletBalance)} available
                              {useWallet && walletAmountUsed > 0
                                ? ` — ${formatPKR(walletAmountUsed)} applied`
                                : ''}
                            </span>
                          </span>
                        </label>
                      ) : (
                        <p className="checkout-wallet__hint">
                          <Wallet size={14} strokeWidth={1.75} aria-hidden />{' '}
                          <Link to="/account/wallet">Top up your wallet</Link> for faster checkout
                          and store credit.
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="checkout-step2-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm checkout-back-btn"
                      onClick={() => setStep(1)}
                    >
                      ← Edit shipping
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-full checkout-step2-next"
                      onClick={() => setStep(3)}
                    >
                      Continue to review
                    </button>
                  </div>
                </div>

                <div
                  id="checkout-step-review"
                  className={step === 3 ? 'checkout-panel card-like' : 'checkout-panel card-like checkout-panel--hidden'}
                >
                  <h2 className="checkout-card-title">Step 3 — Confirm order</h2>
                  <p className="checkout-panel__lead">Review your details and place your order.</p>

                  <div className="checkout-review-block">
                    <h3 className="checkout-review-title">Delivery</h3>
                    <p className="checkout-review-text">{deliveryLabel(s.deliveryOption)}</p>
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
                    <h3 className="checkout-review-title">Payment</h3>
                    <p className="checkout-review-text">
                      {paymentReviewLabel(paymentMethod, payTotal, walletPreview)}
                    </p>
                  </div>
                  <div className="checkout-review-block">
                    <h3 className="checkout-review-title">Order total</h3>
                    <p className="checkout-review-total">{formatPKR(payTotal)}</p>
                    {walletAmountUsed > 0 ? (
                      <p className="checkout-wallet__meta">
                        Includes {formatPKR(walletAmountUsed)} from your wallet
                      </p>
                    ) : null}
                  </div>

                  <div className="checkout-step2-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm checkout-back-btn"
                      onClick={() => setStep(2)}
                    >
                      ← Change payment
                    </button>
                    {paymentMethod === 'stripe' && stripeEnabled ? (
                      <button
                        type="button"
                        className="btn btn-gold btn-full checkout-place-order"
                        disabled={placing}
                        onClick={openStripeModal}
                      >
                        {placing ? 'Processing payment…' : 'PAY WITH CARD'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-gold btn-full checkout-place-order"
                        disabled={placing}
                        onClick={handlePlaceOrder}
                      >
                        {placing ? 'Placing order…' : 'PLACE ORDER'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
            </div>

            {cart.length > 0 ? (
              <aside className="checkout-summary-col" aria-label="Order summary">
                <div className="checkout-summary checkout-summary--sticky card-like">
                  <h2 className="checkout-summary__title">
                    Order summary
                    <span className="checkout-summary__count">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </h2>

                  <ul className="checkout-summary__items">
                    {cart.map((line) => {
                      const p = line.product || {};
                      const ref = p._id || line.product;
                      const img = productImageUrl(p);
                      const unit = Number(line.price) || 0;
                      const qty = Number(line.quantity) || 0;
                      const lineTotal = Number(line.lineTotal ?? unit * qty) || 0;
                      return (
                        <li key={String(ref)} className="checkout-summary__line">
                          <div className="checkout-summary__thumb">
                            {img ? (
                              <ProductImage
                                src={img}
                                alt={buildProductImageAlt(p)}
                                className="checkout-summary__img"
                                width={80}
                                height={80}
                              />
                            ) : (
                              <span className="checkout-summary__placeholder" aria-hidden>
                                📦
                              </span>
                            )}
                          </div>
                          <div className="checkout-summary__meta">
                            <Link
                              to={buildProductPath(p.slug || '', getProductCategorySlug(p))}
                              className="checkout-summary__name"
                            >
                              {p.name || 'Product'}
                            </Link>
                            {p.cartVariantNote ? (
                              <span className="checkout-summary__variant">{p.cartVariantNote}</span>
                            ) : null}
                            <span className="checkout-summary__qty">
                              {formatPKR(unit)} × {qty}
                            </span>
                          </div>
                          <span className="checkout-summary__line-total">{formatPKR(lineTotal)}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="checkout-summary__totals">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>{formatPKR(round2(subtotal))}</span>
                    </div>
                    {discountAmount > 0 ? (
                      <div className="summary-row checkout-summary__discount">
                        <span>Discount</span>
                        <span>−{formatPKR(discountAmount)}</span>
                      </div>
                    ) : null}
                    {cartState.coupon?.code ? (
                      <p className="checkout-summary__coupon">
                        Coupon <strong>{cartState.coupon.code}</strong> applied
                      </p>
                    ) : null}
                    {checkoutSummary ? (
                      <>
                        <div className="summary-row">
                          <span>
                            {shippingSummaryLabel(activeDelivery)}
                            {checkoutSummary.shippingPrice === 0 ? ' — free' : ''}
                          </span>
                          <span>{formatPKR(checkoutSummary.shippingPrice)}</span>
                        </div>
                        {checkoutSummary.cartWeightKg != null && activeDelivery === 'standard' ? (
                          <div className="summary-row summary-row--muted">
                            <span>Cart weight</span>
                            <span>{checkoutSummary.cartWeightKg} kg</span>
                          </div>
                        ) : null}
                        {checkoutSummary.taxPrice > 0 ? (
                          <div className="summary-row">
                            <span>
                              Tax
                              {storeSettings?.taxRate > 0
                                ? ` (${Math.round(Number(storeSettings.taxRate) * 10000) / 100}%)`
                                : ''}
                            </span>
                            <span>{formatPKR(checkoutSummary.taxPrice)}</span>
                          </div>
                        ) : null}
                        {walletAmountUsed > 0 ? (
                          <div className="summary-row checkout-summary__wallet">
                            <span>Bazaar Wallet</span>
                            <span>−{formatPKR(walletAmountUsed)}</span>
                          </div>
                        ) : null}
                        <div className="summary-row total">
                          <span>Total</span>
                          <span>{formatPKR(payTotal)}</span>
                        </div>
                      </>
                    ) : settingsLoading ? (
                      <p className="checkout-summary__loading">Calculating totals…</p>
                    ) : (
                      <p className="checkout-summary__loading">Shipping rates unavailable. Refresh the page.</p>
                    )}
                  </div>

                  <p className="checkout-summary__delivery-note">
                    Delivery: <strong>{deliveryLabel(activeDelivery)}</strong>
                    {step === 1 ? ' — updates when you change speed above' : null}
                  </p>

                  <Link to="/cart" className="checkout-edit-cart link-btn">
                    Edit cart
                  </Link>

                  <p className="checkout-summary__lock">
                    <ShieldCheck size={14} strokeWidth={1.75} aria-hidden />
                    {stripeEnabled ? 'COD or Stripe card payment' : 'Cash on delivery'}
                  </p>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
