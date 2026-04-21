import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef
} from 'react';
import toast from 'react-hot-toast';
import { cartAPI } from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'nova_shop_guest_cart';

function apiErrorMessage(error, fallback) {
  const d = error.response?.data;
  return d?.message || d?.error || fallback;
}

function unwrapCartPayload(res) {
  const data = res?.data?.data;
  if (!data) {
    return emptyNormalized();
  }
  return {
    items: Array.isArray(data.items) ? data.items : [],
    totals: data.totals || null,
    coupon: data.coupon || null,
    discountAmount: Number(data.discountAmount) || 0,
    storeSettings: data.storeSettings || null,
    pricingPreview: data.pricingPreview || null
  };
}

function emptyNormalized() {
  return {
    items: [],
    totals: null,
    coupon: null,
    discountAmount: 0,
    storeSettings: null,
    pricingPreview: null
  };
}

function minimalProduct(p) {
  if (!p || typeof p !== 'object') return {};
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price) || 0,
    images: Array.isArray(p.images) ? p.images : [],
    stock: p.stock ?? p.stockQuantity,
    shortDescription: p.shortDescription,
    category: p.category
  };
}

function computeGuestTotals(items, discountAmount = 0) {
  const itemsSubtotal = items.reduce(
    (sum, line) =>
      sum +
      (line.lineTotal ??
        Number(line.price || 0) * Number(line.quantity || 0)),
    0
  );
  const roundedSub = Math.round(itemsSubtotal * 100) / 100;
  const disc = Math.min(discountAmount, roundedSub);
  const total = Math.round((roundedSub - disc) * 100) / 100;
  return {
    itemsSubtotal: roundedSub,
    discountAmount: disc,
    total
  };
}

function normalizeGuestState(parsed) {
  if (!parsed || !Array.isArray(parsed.items)) {
    return emptyNormalized();
  }
  const items = parsed.items.map((line) => {
    const product = minimalProduct(line.product);
    const qty = Math.max(0, Number(line.quantity) || 0);
    const unit = Number(line.price ?? product.price) || 0;
    return {
      product,
      quantity: qty,
      price: unit,
      lineTotal: Math.round(unit * qty * 100) / 100
    };
  });
  const storedDisc = Number(parsed.discountAmount) || 0;
  const totals = computeGuestTotals(items, storedDisc);
  return {
    items,
    totals,
    coupon: parsed.coupon || null,
    discountAmount: totals.discountAmount
  };
}

function readGuestFromStorage() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return emptyNormalized();
    return normalizeGuestState(JSON.parse(raw));
  } catch {
    return emptyNormalized();
  }
}

function writeGuestNormalized(normalized) {
  localStorage.setItem(
    GUEST_CART_KEY,
    JSON.stringify({
      items: normalized.items,
      coupon: normalized.coupon,
      discountAmount: normalized.discountAmount
    })
  );
}

function buildGuestNormalized(items, coupon = null, discountAmount = 0) {
  const totals = computeGuestTotals(items, discountAmount);
  return {
    items,
    totals,
    coupon,
    discountAmount: totals.discountAmount,
    storeSettings: null,
    pricingPreview: null
  };
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cartState, setCartState] = useState(emptyNormalized);
  const [loading, setLoading] = useState(true);
  const mergedGuestForUser = useRef(null);

  const applyNormalized = useCallback((next) => {
    setCartState(next);
  }, []);

  const fetchCart = useCallback(async () => {
    if (user) {
      try {
        const response = await cartAPI.get();
        applyNormalized(unwrapCartPayload(response));
      } catch (error) {
        console.error('Error fetching cart:', error);
        toast.error(apiErrorMessage(error, 'Could not refresh cart'));
      }
    } else {
      applyNormalized(readGuestFromStorage());
    }
  }, [user, applyNormalized]);

  const mergeGuestIntoServer = useCallback(async () => {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }
    const guestItems = parsed?.items;
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }

    for (const line of guestItems) {
      const id = line.product?._id;
      if (!id) continue;
      const qty = Math.max(1, Number(line.quantity) || 1);
      try {
        await cartAPI.addItem({ productId: String(id), quantity: qty });
      } catch (e) {
        console.error('Guest cart merge line failed:', e);
      }
    }
    localStorage.removeItem(GUEST_CART_KEY);
    toast.success('Your saved cart was added to your account');
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      if (!user) {
        mergedGuestForUser.current = null;
        applyNormalized(readGuestFromStorage());
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      const uid = String(user.id || user._id || '');
      if (mergedGuestForUser.current !== uid) {
        await mergeGuestIntoServer();
        mergedGuestForUser.current = uid;
      }

      try {
        const response = await cartAPI.get();
        if (!cancelled) applyNormalized(unwrapCartPayload(response));
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Do not clear cart on network/API errors — avoids empty UI when backend is down
        if (!cancelled) {
          toast.error(apiErrorMessage(error, 'Could not refresh cart'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, applyNormalized, mergeGuestIntoServer]);

  const items = cartState.items;
  const coupon = cartState.coupon;
  const discount = useMemo(() => {
    if (cartState.totals && Number.isFinite(Number(cartState.totals.discountAmount))) {
      return Number(cartState.totals.discountAmount);
    }
    return Number(cartState.discountAmount) || 0;
  }, [cartState.totals, cartState.discountAmount]);

  const total = useMemo(() => {
    if (cartState.totals && Number.isFinite(Number(cartState.totals.total))) {
      return Number(cartState.totals.total);
    }
    return items.reduce(
      (sum, line) =>
        sum +
        (line.lineTotal ??
          Number(line.price || 0) * Number(line.quantity || 0)),
      0
    );
  }, [cartState.totals, items]);

  const itemCount = useMemo(
    () => items.reduce((sum, line) => sum + (line.quantity || 0), 0),
    [items]
  );

  const addToCart = useCallback(
    async (product, quantity = 1, options = {}) => {
      const silent = Boolean(options.silent);
      const ref = product?._id || product?.productId || product?.slug;
      if (!ref) {
        toast.error('Invalid product');
        return { success: false, error: 'Invalid product' };
      }
      const qty = Math.max(1, Number(quantity) || 1);
      const name = product?.name || 'Item';

      if (!user) {
        const prev = readGuestFromStorage();
        const lines = [...prev.items];
        const pid = String(product._id || ref);
        const idx = lines.findIndex(
          (l) => String(l.product?._id || '') === pid
        );
        const unit = Number(product.price) || 0;
        const stock = product.stock ?? product.stockQuantity;
        if (Number.isFinite(stock) && stock >= 0) {
          const existingQty = idx >= 0 ? lines[idx].quantity || 0 : 0;
          if (existingQty + qty > stock) {
            toast.error(`Only ${stock} in stock`);
            return { success: false, error: `Only ${stock} in stock` };
          }
        }
        if (idx >= 0) {
          const nextQty = lines[idx].quantity + qty;
          lines[idx] = {
            ...lines[idx],
            quantity: nextQty,
            price: unit,
            lineTotal: Math.round(unit * nextQty * 100) / 100
          };
        } else {
          lines.push({
            product: minimalProduct(product),
            quantity: qty,
            price: unit,
            lineTotal: Math.round(unit * qty * 100) / 100
          });
        }
        const norm = buildGuestNormalized(
          lines,
          prev.coupon,
          prev.discountAmount || 0
        );
        writeGuestNormalized(norm);
        applyNormalized(norm);
        if (!silent) toast.success(`${name} added to cart`);
        return { success: true };
      }

      try {
        await cartAPI.addItem({ productId: String(ref), quantity: qty });
        await fetchCart();
        if (!silent) toast.success(`${name} added to cart`);
        return { success: true };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Failed to add to cart');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [user, applyNormalized, fetchCart]
  );

  const updateQuantity = useCallback(
    async (productRef, quantity) => {
      const q = Number(quantity);

      if (!user) {
        const prev = readGuestFromStorage();
        const lines = prev.items
          .map((line) => {
            if (String(line.product?._id) !== String(productRef)) return line;
            if (!Number.isInteger(q) || q <= 0) return null;
            const unit = Number(line.price) || 0;
            const stock = line.product?.stock;
            if (Number.isFinite(stock) && stock >= 0 && q > stock) {
              toast.error(`Only ${stock} in stock`);
              return line;
            }
            return {
              ...line,
              quantity: q,
              lineTotal: Math.round(unit * q * 100) / 100
            };
          })
          .filter(Boolean);
        const norm = buildGuestNormalized(
          lines,
          prev.coupon,
          prev.discountAmount || 0
        );
        writeGuestNormalized(norm);
        applyNormalized(norm);
        toast.success(q <= 0 ? 'Item removed' : 'Cart updated');
        return { success: true };
      }

      try {
        await cartAPI.updateItem({
          productId: String(productRef),
          quantity: q
        });
        await fetchCart();
        toast.success('Cart updated');
        return { success: true };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Failed to update cart');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [user, applyNormalized, fetchCart]
  );

  const removeFromCart = useCallback(
    async (productRef) => {
      if (!user) {
        const prev = readGuestFromStorage();
        const filtered = prev.items.filter(
          (line) => String(line.product?._id) !== String(productRef)
        );
        const norm = buildGuestNormalized(
          filtered,
          prev.coupon,
          prev.discountAmount || 0
        );
        writeGuestNormalized(norm);
        applyNormalized(norm);
        toast.success('Removed from cart');
        return { success: true };
      }

      try {
        await cartAPI.removeItem(String(productRef));
        await fetchCart();
        toast.success('Removed from cart');
        return { success: true };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Failed to remove item');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [user, applyNormalized, fetchCart]
  );

  const clearCart = useCallback(async () => {
    if (!user) {
      localStorage.removeItem(GUEST_CART_KEY);
      applyNormalized(emptyNormalized());
      toast.success('Cart cleared');
      return { success: true };
    }

    try {
      await cartAPI.clear();
      await fetchCart();
      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
      const msg = apiErrorMessage(error, 'Failed to clear cart');
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, [user, applyNormalized, fetchCart]);

  const applyCoupon = useCallback(
    async (code) => {
      const trimmed = String(code || '').trim();
      if (!trimmed) {
        toast.error('Enter a coupon code');
        return { success: false, error: 'Enter a coupon code' };
      }

      if (!user) {
        toast.error('Sign in to apply coupon codes');
        return { success: false, error: 'Sign in to apply coupon codes' };
      }

      try {
        await cartAPI.applyCoupon(trimmed);
        await fetchCart();
        toast.success('Coupon applied');
        return { success: true };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Invalid coupon');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [user, fetchCart]
  );

  const removeCoupon = useCallback(async () => {
    if (!user) {
      toast.info('Sign in to use coupons');
      return { success: false, error: 'Sign in to use coupons' };
    }

    try {
      await cartAPI.removeCoupon();
      await fetchCart();
      toast.success('Coupon removed');
      return { success: true };
    } catch (error) {
      const msg = apiErrorMessage(error, 'Could not remove coupon');
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, [user, fetchCart]);

  const getCartCount = useCallback(() => itemCount, [itemCount]);

  const getCartTotal = useCallback(() => total, [total]);

  const getSubtotal = useCallback(() => {
    if (cartState.totals && Number.isFinite(Number(cartState.totals.itemsSubtotal))) {
      return Number(cartState.totals.itemsSubtotal);
    }
    return items.reduce(
      (sum, line) =>
        sum +
        (line.lineTotal ??
          Number(line.price || 0) * Number(line.quantity || 0)),
      0
    );
  }, [cartState.totals, items]);

  const value = useMemo(
    () => ({
      items,
      total,
      itemCount,
      discount,
      coupon,
      cart: items,
      cartState,
      loading,
      addToCart,
      updateQuantity,
      updateCartItem: updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      getCartCount,
      getCartTotal,
      getSubtotal,
      fetchCart
    }),
    [
      items,
      total,
      itemCount,
      discount,
      coupon,
      cartState,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      getCartCount,
      getCartTotal,
      getSubtotal,
      fetchCart
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
