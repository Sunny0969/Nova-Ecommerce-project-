import React, { useEffect, useState } from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import './Toast.css';

const toastBase =
  '!rounded-xl !px-4 !py-3 !text-sm !font-medium !shadow-lg !min-w-0 !w-full !max-w-[min(calc(100vw-2rem),22rem)] !flex !flex-row !items-start !gap-3 !text-left !leading-snug';

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isMobile;
}

function truncateLabel(text, max = 52) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

/**
 * Professional add-to-cart confirmation — short heading + product name (2 lines max).
 * @param {string} productName
 * @param {string} [variantNote]
 */
export function showAddedToCartToast(productName, variantNote = '') {
  const name = truncateLabel(productName);
  const variant = String(variantNote || '').trim();

  hotToast.custom(
    (t) => (
      <div
        className={`cart-added-toast${t.visible ? ' cart-added-toast--visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        <span className="cart-added-toast__icon" aria-hidden>
          <CheckCircle2 size={22} strokeWidth={2.25} />
        </span>
        <div className="cart-added-toast__body">
          <p className="cart-added-toast__title">Added to cart</p>
          <p className="cart-added-toast__name">
            {name}
            {variant ? <span className="cart-added-toast__variant"> ({variant})</span> : null}
          </p>
        </div>
      </div>
    ),
    { duration: 3200 }
  );
}

/**
 * App-level toast host — import once in `App.js`.
 * Mobile: full-width bar above WhatsApp FAB.
 */
export function AppToaster() {
  const isMobile = useMobileViewport();

  return (
    <Toaster
      position={isMobile ? 'bottom-center' : 'top-right'}
      gutter={10}
      containerStyle={
        isMobile
          ? {
              left: 16,
              right: 16,
              bottom: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))',
              top: 'auto',
            }
          : undefined
      }
      containerClassName={
        isMobile
          ? 'app-toaster app-toaster--mobile'
          : 'app-toaster app-toaster--desktop !top-4 !right-4 sm:!top-6 sm:!right-6'
      }
      toastOptions={{
        duration: 4000,
        className: `${toastBase} !bg-rozana-navy !text-white`,
        success: {
          duration: 3500,
          iconTheme: {
            primary: '#16A34A',
            secondary: '#ffffff',
          },
          className: `${toastBase} !bg-rozana-navy !text-white`,
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#F97316',
            secondary: '#ffffff',
          },
          className: `${toastBase} !bg-rozana-navy !text-white`,
        },
        loading: {
          className: `${toastBase} !bg-rozana-navy-deep !text-white`,
        },
      }}
    />
  );
}

/** Re-export so callers can use `import { toast } from './components/Toast'` */
export const toast = hotToast;

export default AppToaster;
