import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, ShoppingCart, Truck } from 'lucide-react';
import SEO from '../components/SEO';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import CartItem from '../components/CartItem';
import { formatPKR } from '../utils/currency';
import { computeTotalsPreview } from '../utils/pricing';
import { storeSettingsAPI } from '../api/axios';
import RecommendationRow from '../components/RecommendationRow';
import { recommendationsAPI } from '../api/axios';
import { getSessionId } from '../lib/sessionId';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [publicSettings, setPublicSettings] = useState(null);
  const [mightLike, setMightLike] = useState([]);

  useEffect(() => {
    let cancelled = false;
    storeSettingsAPI
      .get()
      .then((r) => {
        if (!cancelled) setPublicSettings(r.data?.data || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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

  const settings = user ? cartState.storeSettings : publicSettings;

  const preview = useMemo(() => {
    if (!cart.length || !settings) return null;
    if (user && cartState.pricingPreview) return cartState.pricingPreview;
    return computeTotalsPreview(subtotal, discountAmount, 'standard', settings);
  }, [cart.length, user, cartState.pricingPreview, subtotal, discountAmount, settings]);

  const freeThreshold = useMemo(() => {
    const t = Number(settings?.freeShippingMin);
    return Number.isFinite(t) && t >= 0 ? t : 50;
  }, [settings]);

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

  const emptyFreeExample = publicSettings?.freeShippingMin ?? 50;

  return (
    <>
      <SEO
        noIndex
        title="Shopping cart"
        description="Review your Nova Shop basket, apply a coupon, and proceed to secure checkout."
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

      <main className="cart-page" id="main-content">
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
                    message={`Browse the shop and add products you love — free standard delivery on orders over ${formatPKR(emptyFreeExample)} (store minimum).`}
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
                        <span className="label">Shipping (standard)</span>
                        <span className="value">
                          {preview.shippingPrice === 0 ? (
                            <span className="cart-summary__free">Free</span>
                          ) : (
                            formatPKR(preview.shippingPrice)
                          )}
                        </span>
                      </div>
                      {subtotal < freeThreshold ? (
                        <p className="cart-summary__ship-hint">
                          Add {formatPKR(freeThreshold - subtotal)} more in items for free standard shipping (over{' '}
                          {formatPKR(freeThreshold)} subtotal).
                        </p>
                      ) : null}
                      {preview.taxPrice > 0 ? (
                        <div className="summary-row">
                          <span className="label">Tax</span>
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
                  ) : (
                    <p className="cart-summary__ship-hint text-sm text-neutral-600">Loading shipping &amp; tax…</p>
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
                      Free standard delivery on orders over {formatPKR(freeThreshold)}
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
      </main>
    </>
  );
};

export default Cart;
