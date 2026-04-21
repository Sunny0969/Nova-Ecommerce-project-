import React from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';

const toastBase =
  '!rounded-lg !px-4 !py-3 !text-sm !font-medium !shadow-lg !max-w-[min(100vw-2rem,24rem)]';

/**
 * App-level toast host — import once in `App.js` (replaces raw `<Toaster />`).
 * Uses Tailwind classes via `!` prefix so they win over library defaults.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      containerClassName="!top-4 !right-4 sm:!top-6 sm:!right-6"
      toastOptions={{
        duration: 4000,
        className: `${toastBase} !bg-neutral-900 !text-white`,
        style: {},
        success: {
          duration: 3500,
          iconTheme: {
            primary: '#22c55e',
            secondary: '#ffffff',
          },
          className: `${toastBase} !bg-neutral-900 !text-white`,
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#f87171',
            secondary: '#ffffff',
          },
          className: `${toastBase} !bg-neutral-900 !text-white`,
        },
        loading: {
          className: `${toastBase} !bg-neutral-800 !text-neutral-100`,
        },
      }}
    />
  );
}

/** Re-export so callers can use `import { toast } from './components/Toast'` */
export const toast = hotToast;

export default AppToaster;
