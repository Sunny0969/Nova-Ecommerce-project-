import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef
} from 'react';
import { toast, showAddedToCartToast } from '../components/Toast';
import { cartAPI, publicAPI } from '../api/storefront';
import { useAuth } from './AuthContext';

function trackMetaAddToCart(product, quantity, user) {
  void import('../lib/metaPixel').then(({ trackAddToCart }) =>
    trackAddToCart(product, quantity, user)
  );
}

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

function minimalProduct(p, opts = {}) {
  if (!p || typeof p !== 'object') return {};
  const noteFromOpts = opts.cartVariantNote != null ? String(opts.cartVariantNote).trim() : '';
  const noteFromP = p.cartVariantNote != null ? String(p.cartVariantNote).trim() : '';
  const note = noteFromOpts || noteFromP;
  const id = p._id != null ? String(p._id) : '';
  const cartLineKey = note ? `${id}::${encodeURIComponent(note)}` : id;
  const stock =
    opts.effectiveStock != null
      ? opts.effectiveStock
      : p.stock ?? p.stockQuantity;
  const price =
    opts.effectivePrice != null
      ? Number(opts.effectivePrice)
      : Number(p.price) || 0;
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price,
    images: Array.isArray(p.images) ? p.images : [],
    stock,
    shortDescription: p.shortDescription,
    category: p.category,
    cartVariantNote: note,
    cartLineKey,
    weight: p.weight,
    weightKg: p.weightKg
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
    const product = minimalProduct(line.product, {
      cartVariantNote: line.product?.cartVariantNote
    });
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

function guestItemsPayload(items) {
  return (items || [])
    .map((line) => ({
      productId: line.product?._id || line.product,
      quantity: Number(line.quantity) || 1,
      price: line.price != null ? Number(line.price) : undefined
    }))
    .filter((line) => line.productId);
}

async function validateGuestCoupon(code, items) {
  const res = await publicAPI.validateCoupon({ code, items: guestItemsPayload(items) });
  const data = res?.data?.data;
  if (!data?.coupon) {
    throw new Error('Invalid coupon');
  }
  return {
    coupon: data.coupon,
    discountAmount: Number(data.discountAmount) || 0
  };
}

async function refreshGuestCouponOnLines(lines, couponCode) {
  if (!couponCode) {
    return buildGuestNormalized(lines, null, 0);
  }
  try {
    const { coupon, discountAmount } = await validateGuestCoupon(couponCode, lines);
    return buildGuestNormalized(lines, coupon, discountAmount);
  } catch {
    return buildGuestNormalized(lines, null, 0);
  }
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, canAccessCustomerApp, loading: authLoading } = useAuth();
  const customerUser = canAccessCustomerApp ? user : null;
  const [cartState, setCartState] = useState(emptyNormalized);
  const [loading, setLoading] = useState(true);
  const mergedGuestForUser = useRef(null);

  const applyNormalized = useCallback((next) => {
    setCartState(next);
  }, []);

  const fetchCart = useCallback(async () => {
    if (customerUser) {
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
  }, [customerUser, applyNormalized]);

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
      if (!customerUser) {
        mergedGuestForUser.current = null;
        applyNormalized(readGuestFromStorage());
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);
      const uid = String(customerUser.id || customerUser._id || '');
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
  }, [authLoading, customerUser, applyNormalized, mergeGuestIntoServer]);

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
      const cartVariantNote = String(options.cartVariantNote || '').trim();
      const ref = product?._id || product?.productId || product?.slug;
      if (!ref) {
        toast.error('Invalid product');
        return { success: false, error: 'Invalid product' };
      }
      const qty = Math.max(1, Number(quantity) || 1);
      const name = product?.name || 'Item';

      if (!customerUser) {
        const prev = readGuestFromStorage();
        const lines = [...prev.items];
        const pid = String(product._id || ref);
        const idx = lines.findIndex(
          (l) =>
            String(l.product?._id || '') === pid &&
            String(l.product?.cartVariantNote || '').trim() === cartVariantNote
        );
        const unit =
          options.effectivePrice != null
            ? Number(options.effectivePrice)
            : Number(product.price) || 0;
        const stock =
          options.effectiveStock ?? product.stock ?? product.stockQuantity;
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
            product: minimalProduct(product, {
              cartVariantNote,
              effectiveStock: options.effectiveStock,
              effectivePrice: options.effectivePrice
            }),
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
        if (!silent) showAddedToCartToast(name, cartVariantNote);
        trackMetaAddToCart(product, qty, customerUser);
        return { success: true };
      }

      try {
        await cartAPI.addItem({ productId: String(ref), quantity: qty });
        await fetchCart();
        if (!silent) showAddedToCartToast(name, cartVariantNote);
        trackMetaAddToCart(product, qty, customerUser);
        return { success: true };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Failed to add to cart');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [customerUser, applyNormalized, fetchCart]
  );

  const updateQuantity = useCallback(
    async (productRef, quantity) => {
      const q = Number(quantity);

      if (!customerUser) {
        const prev = readGuestFromStorage();
        const lines = prev.items
          .map((line) => {
            const lineRef = String(line.product?.cartLineKey || line.product?._id || '');
            if (lineRef !== String(productRef)) return line;
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
        const norm = await refreshGuestCouponOnLines(lines, prev.coupon?.code);
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
    [customerUser, applyNormalized, fetchCart]
  );

  const removeFromCart = useCallback(
    async (productRef) => {
      if (!customerUser) {
        const prev = readGuestFromStorage();
        const filtered = prev.items.filter((line) => {
          const lineRef = String(line.product?.cartLineKey || line.product?._id || '');
          return lineRef !== String(productRef);
        });
        const norm = await refreshGuestCouponOnLines(filtered, prev.coupon?.code);
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
    [customerUser, applyNormalized, fetchCart]
  );

  const clearCart = useCallback(async () => {
    if (!customerUser) {
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
  }, [customerUser, applyNormalized, fetchCart]);

  const applyCoupon = useCallback(
    async (code) => {
      const trimmed = String(code || '').trim();
      if (!trimmed) {
        toast.error('Enter a coupon code');
        return { success: false, error: 'Enter a coupon code' };
      }

      if (!customerUser) {
        const prev = readGuestFromStorage();
        if (!prev.items?.length) {
          toast.error('Your cart is empty');
          return { success: false, error: 'Your cart is empty' };
        }
        try {
          const { coupon, discountAmount } = await validateGuestCoupon(trimmed, prev.items);
          const norm = buildGuestNormalized(prev.items, coupon, discountAmount);
          writeGuestNormalized(norm);
          applyNormalized(norm);
          toast.success('Coupon applied');
          return { success: true };
        } catch (error) {
          const msg = apiErrorMessage(error, 'Invalid coupon');
          toast.error(msg);
          return { success: false, error: msg };
        }
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
    [customerUser, applyNormalized, fetchCart]
  );

  const removeCoupon = useCallback(async () => {
    if (!customerUser) {
      const prev = readGuestFromStorage();
      const norm = buildGuestNormalized(prev.items, null, 0);
      writeGuestNormalized(norm);
      applyNormalized(norm);
      toast.success('Coupon removed');
      return { success: true };
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
  }, [customerUser, applyNormalized, fetchCart]);

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
