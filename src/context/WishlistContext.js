import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef
} from 'react';
import toast from 'react-hot-toast';
import { wishlistAPI, productsAPI } from 'api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const GUEST_WISHLIST_KEY = 'nova_shop_guest_wishlist';

function unwrapWishlist(res) {
  const w = res?.data?.data?.wishlist;
  if (!w) return { products: [] };
  return {
    _id: w._id,
    user: w.user,
    products: Array.isArray(w.products) ? w.products : [],
    createdAt: w.createdAt,
    updatedAt: w.updatedAt
  };
}

function emptyWishlist() {
  return { products: [] };
}

function readGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return emptyWishlist();
    const p = JSON.parse(raw);
    return {
      products: Array.isArray(p.products) ? p.products : []
    };
  } catch {
    return emptyWishlist();
  }
}

function writeGuestWishlist(products) {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify({ products }));
}

function minimalProduct(p) {
  if (!p || typeof p !== 'object') return null;
  return {
    _id: p._id,
    slug: p.slug,
    name: p.name,
    price: Number(p.price) || 0,
    stock: p.stock,
    images: Array.isArray(p.images) ? p.images : [],
    shortDescription: p.shortDescription,
    description: p.description,
    category: p.category,
    ratings: p.ratings,
    numReviews: p.numReviews,
    comparePrice: p.comparePrice,
    isFeatured: p.isFeatured,
    isPublished: p.isPublished
  };
}

function apiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error.message ||
    fallback
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState(emptyWishlist);
  const [loading, setLoading] = useState(true);
  const mergedGuestForUser = useRef(null);

  const applyWishlist = useCallback((next) => {
    if (!next) {
      setWishlist(emptyWishlist());
      return;
    }
    setWishlist({
      _id: next._id,
      user: next.user,
      createdAt: next.createdAt,
      updatedAt: next.updatedAt,
      products: Array.isArray(next.products) ? next.products : []
    });
  }, []);

  const fetchWishlist = useCallback(async () => {
    if (user) {
      try {
        const res = await wishlistAPI.get();
        applyWishlist(unwrapWishlist(res));
      } catch (error) {
        console.error('Wishlist fetch error:', error);
      }
    } else {
      applyWishlist(readGuestWishlist());
    }
  }, [user, applyWishlist]);

  const mergeGuestIntoServer = useCallback(async () => {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!raw) return;
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      localStorage.removeItem(GUEST_WISHLIST_KEY);
      return;
    }
    const guestProducts = parsed?.products;
    if (!Array.isArray(guestProducts) || guestProducts.length === 0) {
      localStorage.removeItem(GUEST_WISHLIST_KEY);
      return;
    }

    let serverRes;
    try {
      serverRes = await wishlistAPI.get();
    } catch (e) {
      console.error(e);
      return;
    }

    const serverWishlist = unwrapWishlist(serverRes);
    const serverProducts = serverWishlist.products || [];

    const hasOnServer = (p) => {
      const id = p?._id != null ? String(p._id) : '';
      const slug = p?.slug ? String(p.slug) : '';
      return serverProducts.some(
        (sp) =>
          (id && String(sp._id) === id) ||
          (slug && sp.slug === slug)
      );
    };

    for (const gp of guestProducts) {
      if (hasOnServer(gp)) continue;
      const ref = gp._id || gp.slug;
      if (!ref) continue;
      try {
        await wishlistAPI.toggle(String(ref));
      } catch (e) {
        console.error('Wishlist merge item failed:', e);
      }
    }

    localStorage.removeItem(GUEST_WISHLIST_KEY);
    toast.success('Wishlist synced to your account');
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      if (!user) {
        mergedGuestForUser.current = null;
        applyWishlist(readGuestWishlist());
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
        const res = await wishlistAPI.get();
        if (!cancelled) applyWishlist(unwrapWishlist(res));
      } catch (error) {
        console.error('Wishlist load error:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, applyWishlist, mergeGuestIntoServer]);

  const products = useMemo(
    () => (Array.isArray(wishlist?.products) ? wishlist.products : []),
    [wishlist?.products]
  );
  const count = products.length;

  /**
   * @param {string | object} productOrRef — product slug/id string, or product object
   */
  const toggleWishlist = useCallback(
    async (productOrRef) => {
      const ref =
        typeof productOrRef === 'object' && productOrRef
          ? String(productOrRef._id || productOrRef.slug || '')
          : String(productOrRef || '');

      if (!ref) {
        toast.error('Invalid product');
        return { success: false, error: 'Invalid product' };
      }

      if (!user) {
        let product =
          typeof productOrRef === 'object' && productOrRef?._id
            ? minimalProduct(productOrRef)
            : null;

        if (!product) {
          try {
            const res = await productsAPI.getOne(ref);
            const data = res?.data?.data;
            if (data) product = minimalProduct(data);
          } catch {
            toast.error('Could not load product');
            return { success: false, error: 'Could not load product' };
          }
        }

        if (!product || !product._id) {
          toast.error('Invalid product');
          return { success: false, error: 'Invalid product' };
        }

        const prev = readGuestWishlist();
        const list = [...prev.products];
        const idx = list.findIndex((p) => String(p._id) === String(product._id));
        let action;
        if (idx >= 0) {
          list.splice(idx, 1);
          action = 'removed';
        } else {
          list.push(product);
          action = 'added';
        }
        writeGuestWishlist(list);
        applyWishlist({ products: list });
        toast.success(
          action === 'added' ? 'Saved to wishlist' : 'Removed from wishlist'
        );
        return { success: true, action };
      }

      try {
        const res = await wishlistAPI.toggle(ref);
        const d = res?.data?.data;
        if (d?.wishlist) {
          applyWishlist(d.wishlist);
        } else {
          await fetchWishlist();
        }
        const action = d?.action;
        toast.success(
          action === 'added'
            ? 'Saved to wishlist'
            : action === 'removed'
              ? 'Removed from wishlist'
              : 'Wishlist updated'
        );
        return { success: true, action };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Wishlist update failed');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [user, applyWishlist, fetchWishlist]
  );

  const removeFromWishlist = useCallback(
    async (productRef) => {
      const ref = String(productRef || '');
      if (!ref) {
        toast.error('Invalid product');
        return { success: false, error: 'Invalid product' };
      }

      if (!user) {
        const prev = readGuestWishlist();
        const next = prev.products.filter(
          (p) => String(p._id) !== ref && String(p.slug) !== ref
        );
        writeGuestWishlist(next);
        applyWishlist({ products: next });
        toast.success('Removed from wishlist');
        return { success: true };
      }

      try {
        const res = await wishlistAPI.remove(ref);
        const d = res?.data?.data;
        if (d?.wishlist) {
          applyWishlist(d.wishlist);
        } else {
          await fetchWishlist();
        }
        toast.success('Removed from wishlist');
        return { success: true };
      } catch (error) {
        const msg = apiErrorMessage(error, 'Could not remove item');
        toast.error(msg);
        return { success: false, error: msg };
      }
    },
    [user, applyWishlist, fetchWishlist]
  );

  const clearWishlist = useCallback(async () => {
    if (!user) {
      localStorage.removeItem(GUEST_WISHLIST_KEY);
      applyWishlist(emptyWishlist());
      toast.success('Wishlist cleared');
      return { success: true };
    }

    try {
      const res = await wishlistAPI.clear();
      const d = res?.data?.data;
      if (d?.wishlist) {
        applyWishlist(d.wishlist);
      } else {
        await fetchWishlist();
      }
      toast.success('Wishlist cleared');
      return { success: true };
    } catch (error) {
      const msg = apiErrorMessage(error, 'Could not clear wishlist');
      toast.error(msg);
      return { success: false, error: msg };
    }
  }, [user, applyWishlist, fetchWishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      products,
      count,
      loading,
      fetchWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist
    }),
    [
      wishlist,
      products,
      count,
      loading,
      fetchWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist
    ]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
