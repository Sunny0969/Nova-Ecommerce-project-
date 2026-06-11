import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShoppingCart, Truck } from 'lucide-react';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CartItem from '../components/CartItem';
import { formatPKR } from '../utils/currency';
import { computeTotalsPreview, computeCartWeightKg } from '../utils/pricing';
import { recommendationsAPI } from 'api';
import RecommendationRow from '../components/RecommendationRow';
import { getSessionId } from '../lib/sessionId';
import { useStoreSettings } from '../hooks/useStoreSettings';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

const Cart = () => {
  const navigate = useNavigate();
  const {
    cart,
    cartState,
    loading: cartLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    getSubtotal
  } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [mightLike, setMightLike] = useState([]);
  const { settings, loading: settingsLoading } = useStoreSettings();

  useEffect(() => {
    const sid = getSessionId();
    recommendationsAPI
      .homepage({ sessionId: sid, limit: 12 })
      .then((r) => setMightLike(r.data?.data?.products || []))
      .catch(() => setMightLike([]));
  }, []);

  const totals = cartState.totals;

  const subtotal = getSubtotal();
  const discountAmount = useMemo(() => {
    if (totals && Number.isFinite(Number(totals.discountAmount))) {
      return Number(totals.discountAmount);
    }
    return Number(cartState.discountAmount) || 0;
  }, [totals, cartState.discountAmount]);

  const preview = useMemo(() => {
    if (!cart.length || !settings) return null;
    const cartWeightKg = computeCartWeightKg(cart, settings);
    return computeTotalsPreview(subtotal, discountAmount, 'standard', settings, cartWeightKg);
  }, [cart, subtotal, discountAmount, settings]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) {
      toast.error('Enter a coupon code');
      return;
    }
    await applyCoupon(code);
  };

  const handleCheckout = () => {
    if (!cart.length) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  return (
    <>
      <SEO
        noIndex
        title="Shopping cart"
        description="Review your Bazaar basket, apply a coupon, and proceed to secure checkout."
        canonicalUrl="/cart"
      />
      <header className="page-header">
        <div className="container">
          <h1 className="page-header__title">Shopping cart</h1>
          <p className="page-header__subtitle">Review items, apply savings, then checkout securely.</p>
          <ol className="breadcrumb" aria-label="Breadcrumb">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/shop">Shop</Link>
            </li>
            <li className="active" aria-current="page">
              Cart
            </li>
          </ol>
        </div>
      </header>

      <div className="cart-page">
        <div className="container">
          <div className={`cart-layout ${cart.length === 0 ? 'cart-layout--empty' : ''}`}>
            <div className="cart-page__main">
              <div className="cart-page__head">
                <h2 className="cart-page__title">Your items</h2>
                {cart.length > 0 && (
                  <button type="button" className="cart-page__clear" onClick={() => clearCart()}>
                    Clear cart
                  </button>
                )}
              </div>

              <div className="cart-items">
                {cartLoading ? (
                  <div className="cart-loading">
                    <LoadingSpinner size="lg" label="Loading cart" />
                    <p className="cart-loading__note">Loading your cart…</p>
                  </div>
                ) : cart.length === 0 ? (
                  <EmptyState
                    className="cart-empty-state"
                    illustration={<ShoppingCart className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.25} aria-hidden />}
                    title="Your cart is empty"
                    message="Browse the shop and add products you love. Shipping at checkout depends on delivery speed and cart weight."
                    actionLabel="Continue Shopping"
                    onAction={() => navigate('/shop')}
                  />
                ) : (
                  cart.map((line, idx) => {
                    const p = line.product || {};
                    const ref = p._id || line.product;
                    return (
                      <CartItem
                        key={String(ref)}
                        line={line}
                        animationDelay={`${idx * 0.08}s`}
                        onUpdateQuantity={(productRef, quantity) => updateCartItem(productRef, quantity)}
                        onRemove={(productRef) => removeFromCart(productRef)}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {!cartLoading && cart.length > 0 ? (
              <aside className="cart-page__summary-wrap">
                <div className="cart-summary">
                  <h3>Order summary</h3>

                  <div className="coupon-group">
                    <input
                      type="text"
                      placeholder="COUPON CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      maxLength={32}
                      aria-label="Coupon code"
                    />
                    <button type="button" className="btn btn-gold btn-sm" onClick={handleApplyCoupon}>
                      Apply
                    </button>
                  </div>
                  {cartState.coupon && (
                    <p className="coupon-applied">
                      {cartState.coupon.code} applied
                      <button type="button" className="link-btn" onClick={() => removeCoupon()}>
                        Remove
                      </button>
                    </p>
                  )}

                  <div className="summary-row">
                    <span className="label">Subtotal</span>
                    <span className="value">{formatPKR(round2(subtotal))}</span>
                  </div>

                  {discountAmount > 0 ? (
                    <div className="summary-row">
                      <span className="label">Discount</span>
                      <span className="value summary-row__discount">−{formatPKR(discountAmount)}</span>
                    </div>
                  ) : null}

                  {preview ? (
                    <>
                      <div className="summary-row">
                        <span className="label">
                          Shipping (standard)
                          {preview.shippingPrice === 0 ? ' — free' : ''}
                        </span>
                        <span className="value">{formatPKR(preview.shippingPrice)}</span>
                      </div>
                      {preview.cartWeightKg != null ? (
                        <div className="summary-row summary-row--muted">
                          <span className="label">Cart weight</span>
                          <span className="value">{preview.cartWeightKg} kg</span>
                        </div>
                      ) : null}
                      {preview.taxPrice > 0 ? (
                        <div className="summary-row">
                          <span className="label">
                            Tax
                            {settings?.taxRate > 0
                              ? ` (${Math.round(Number(settings.taxRate) * 10000) / 100}%)`
                              : ''}
                          </span>
                          <span className="value">{formatPKR(preview.taxPrice)}</span>
                        </div>
                      ) : null}
                      <div className="summary-row summary-row--muted">
                        <span className="label">Currency</span>
                        <span className="value">PKR</span>
                      </div>
                      <div className="summary-row total">
                        <span className="label">Estimated total</span>
                        <span className="value">{formatPKR(preview.totalPrice)}</span>
                      </div>
                    </>
                  ) : settingsLoading ? (
                    <p className="cart-summary__ship-hint text-sm text-neutral-600">Loading shipping &amp; tax…</p>
                  ) : (
                    <p className="cart-summary__ship-hint text-sm text-neutral-600">
                      Shipping rates unavailable. Refresh the page.
                    </p>
                  )}

                  <button
                    type="button"
                    className="btn btn-gold btn-full cart-summary__checkout"
                    onClick={handleCheckout}
                  >
                    <span className="cart-summary__checkout-label">PROCEED TO CHECKOUT</span>
                  </button>

                  <Link to="/shop" className="cart-summary__continue">
                    Continue Shopping
                  </Link>

                  <ul className="cart-trust-list" aria-label="Checkout benefits">
                    <li>
                      <Lock size={16} strokeWidth={1.75} aria-hidden />
                      Secure SSL checkout
                    </li>
                    <li>
                      <Truck size={16} strokeWidth={1.75} aria-hidden />
                      Standard {preview ? formatPKR(preview.shippingPrice) : formatPKR(299)} — express &amp; next-day
                      rates shown at checkout
                    </li>
                  </ul>
                  <p className="cart-summary__hint">
                    Final shipping and tax follow your delivery choice at checkout. Cart uses standard shipping for
                    this estimate.
                  </p>
                </div>
              </aside>
            ) : null}
          </div>

          <RecommendationRow title="You might also like" products={mightLike} />
        </div>
      </div>
    </>
  );
};

export default Cart;
