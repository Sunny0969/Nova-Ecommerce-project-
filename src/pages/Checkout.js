import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useForm, useWatch } from 'react-hook-form';
import SEO from '../components/SEO';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ShieldCheck, Banknote, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiMessage } from '../lib/api';
import { authAPI, storeSettingsAPI, ordersAPI } from 'api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPKR } from '../utils/currency';
import { computeTotalsPreview } from '../utils/pricing';
import { EASYPAISA_NUMBER, PAYMENT_OPTIONS } from '../config/payments';
import { productImageUrl } from '../lib/productImage';
import BankTransferProofModal from '../components/BankTransferProofModal';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function shippingSummaryLabel(option) {
  if (option === 'express') return 'Shipping (express)';
  if (option === 'nextday') return 'Shipping (next day)';
  return 'Shipping (standard)';
}

/* Stripe disabled — use COD / Easypaisa bank transfer only.
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
const pk = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = pk ? loadStripe(pk) : null;
*/

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
    phone: saved.phone || user.phone || '',
    street: saved.street || '',
    city: saved.city || '',
    state: saved.state || '',
    zipCode: saved.zipCode || '',
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

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartState, loading, fetchCart, getSubtotal } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [lockedShipping, setLockedShipping] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [publicSettings, setPublicSettings] = useState(null);

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
    let cancelled = false;
    storeSettingsAPI
      .get()
      .then((res) => {
        if (!cancelled) setPublicSettings(res.data?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const storeSettings = user ? cartState.storeSettings || publicSettings : publicSettings;

  const checkoutSummary = useMemo(() => {
    if (!storeSettings || !cart.length) return null;
    return computeTotalsPreview(subtotal, discountAmount, activeDelivery, storeSettings);
  }, [storeSettings, cart.length, subtotal, discountAmount, activeDelivery]);

  const orderTotal = Number(checkoutSummary?.totalPrice ?? totals?.total ?? subtotal);
  const itemCount = cart.reduce((n, line) => n + (Number(line.quantity) || 0), 0);

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
    ...extra
  });

  const finalizePlacement = async (res) => {
    toast.success('Order placed successfully!');
    await fetchCart();
    const orderId = res.data?.data?.order?._id;
    navigate(orderId ? `/order-confirmation/${orderId}` : '/account/orders');
  };

  const submitBankTransferOrder = async ({ transactionId, file }) => {
    if (!lockedShipping) return;
    const tid = String(transactionId || '').trim();
    if (!tid && !file) {
      toast.error('Enter transaction ID or upload a payment screenshot');
      return;
    }

    setPlacing(true);
    try {
      const res = await ordersAPI.place(
        placeOrderPayload(tid ? { transactionId: tid } : {})
      );
      const orderId = res.data?.data?.order?._id;

      if (file && orderId) {
        const fd = new FormData();
        if (tid) fd.append('transactionId', tid);
        fd.append('proof', file);
        try {
          await ordersAPI.uploadPaymentProof(orderId, fd);
        } catch (upErr) {
          toast.error(
            apiMessage(
              upErr,
              'Order placed but screenshot could not be uploaded. Add proof from your order page or contact support.'
            )
          );
          await fetchCart();
          navigate(`/order-confirmation/${orderId}`);
          return;
        }
      }

      setProofModalOpen(false);
      await finalizePlacement(res);
    } catch (err) {
      toast.error(apiMessage(err, 'Could not place order'));
    } finally {
      setPlacing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (!lockedShipping) return;
    if (!paymentMethod) {
      toast.error('Choose a payment method');
      return;
    }

    if (paymentMethod === 'bank_transfer') {
      setProofModalOpen(true);
      return;
    }

    setPlacing(true);
    ordersAPI
      .place(placeOrderPayload())
      .then(finalizePlacement)
      .catch((err) => toast.error(apiMessage(err, 'Could not place order')))
      .finally(() => setPlacing(false));
  };

  if (loading) {
    return (
      <main className="section container checkout-page">
        <LoadingSpinner size="lg" label="Loading checkout" />
      </main>
    );
  }

  const s = lockedShipping || {};

  return (
    <>
      <BankTransferProofModal
        isOpen={proofModalOpen}
        onClose={() => !placing && setProofModalOpen(false)}
        orderTotal={orderTotal}
        onSubmit={submitBankTransferOrder}
        submitting={placing}
      />

      <SEO noIndex title="Checkout" />

      <main className="section checkout-page" id="main-content">
        <div className="container">
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
                      State / Province
                    </label>
                    <input id="ship-state" className="form-control" {...register('state')} />
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

                <button type="submit" className="btn btn-primary btn-full checkout-continue-btn">
                  Continue to payment
                </button>

                <p className="checkout-trust">
                  <ShieldCheck size={16} strokeWidth={1.75} className="checkout-trust__icon" aria-hidden />
                  Secure checkout — cash on delivery or Easypaisa bank transfer.
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
                  <p className="checkout-panel__lead">Card payments are not available. Choose how you would like to pay.</p>

                  <div className="checkout-payment-methods" role="radiogroup" aria-label="Payment method">
                    {PAYMENT_OPTIONS.map((opt) => (
                      <label
                        key={opt.id}
                        className={`checkout-payment-option${paymentMethod === opt.id ? ' is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={opt.id}
                          checked={paymentMethod === opt.id}
                          onChange={() => setPaymentMethod(opt.id)}
                        />
                        <span className="checkout-payment-option__icon" aria-hidden>
                          {opt.id === 'cod' ? <Banknote size={22} /> : <Smartphone size={22} />}
                        </span>
                        <span className="checkout-payment-option__body">
                          <span className="checkout-payment-option__label">{opt.label}</span>
                          <span className="checkout-payment-option__desc">{opt.description}</span>
                          {opt.id === 'bank_transfer' ? (
                            <span className="checkout-payment-option__account">
                              Easypaisa: <strong>{EASYPAISA_NUMBER}</strong>
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>

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
                      {paymentMethod === 'bank_transfer' ? (
                        <>
                          Bank transfer (Easypaisa) — send <strong>{formatPKR(orderTotal)}</strong> to{' '}
                          <strong>{EASYPAISA_NUMBER}</strong>
                        </>
                      ) : (
                        <>Cash on delivery — pay {formatPKR(orderTotal)} when your order arrives.</>
                      )}
                    </p>
                  </div>
                  <div className="checkout-review-block">
                    <h3 className="checkout-review-title">Order total</h3>
                    <p className="checkout-review-total">{formatPKR(orderTotal)}</p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm checkout-back-btn"
                    onClick={() => setStep(2)}
                  >
                    ← Change payment
                  </button>
                  <button
                    type="button"
                    className="btn btn-gold btn-full checkout-place-order"
                    disabled={placing}
                    onClick={handlePlaceOrder}
                  >
                    {placing ? 'Placing order…' : 'PLACE ORDER'}
                  </button>
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
                              <LazyLoadImage src={img} alt="" className="checkout-summary__img" effect="blur" />
                            ) : (
                              <span className="checkout-summary__placeholder" aria-hidden>
                                📦
                              </span>
                            )}
                          </div>
                          <div className="checkout-summary__meta">
                            <Link to={`/shop/${p.slug || ''}`} className="checkout-summary__name">
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
                          <span>{shippingSummaryLabel(activeDelivery)}</span>
                          <span>{formatPKR(checkoutSummary.shippingPrice)}</span>
                        </div>
                        {checkoutSummary.taxPrice > 0 ? (
                          <div className="summary-row">
                            <span>Tax</span>
                            <span>{formatPKR(checkoutSummary.taxPrice)}</span>
                          </div>
                        ) : null}
                        <div className="summary-row total">
                          <span>Total</span>
                          <span>{formatPKR(checkoutSummary.totalPrice)}</span>
                        </div>
                      </>
                    ) : (
                      <p className="checkout-summary__loading">Calculating totals…</p>
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
                    COD or Easypaisa — no card required
                  </p>
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}
