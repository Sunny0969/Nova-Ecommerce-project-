import { META_PIXEL_ID } from './metaPixel';

export const GA4_MEASUREMENT_ID = 'G-S6GWN1X1JT';
export const GTM_CONTAINER_ID = 'GTM-MMBMKP9R';

const ONESIGNAL_APP_ID = 'a0266c18-958d-485a-ad42-8d0797b119ca';
const ONESIGNAL_SAFARI_WEB_ID = 'web.onesignal.auto.2b467c5d-2ccd-4e09-a57b-cb7ab9efd0c0';

const IDLE_FALLBACK_MS = 3000;
const IDLE_TIMEOUT_MS = 8000;

let loadPromise = null;
let loaded = false;

/** Lightweight queues only — no external network requests. */
export function installThirdPartyStubs() {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  if (typeof window.fbq !== 'function') {
    const queue = [];
    const fbq = function fbqFn() {
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : queue.push(arguments);
    };
    fbq.queue = queue;
    fbq.loaded = false;
    fbq.version = '2.0';
    fbq.push = fbq;
    window.fbq = fbq;
    window._fbq = fbq;
  }

  window.OneSignalDeferred = window.OneSignalDeferred || [];
}

function injectScript(src, { id, defer = false } = {}) {
  return new Promise((resolve, reject) => {
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    if ([...document.scripts].some((node) => node.src === src)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    if (defer) script.defer = true;
    if (id) script.id = id;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/** Run when the main thread is idle — avoids blocking paint / interaction. */
function scheduleOnIdle(fn, { fallbackMs = IDLE_FALLBACK_MS, timeoutMs = IDLE_TIMEOUT_MS } = {}) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => fn(), { timeout: timeoutMs });
    return;
  }
  window.setTimeout(fn, fallbackMs);
}

function loadGa4() {
  return injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`, {
    id: 'bazaar-ga4',
    defer: true
  }).then(() => {
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID);
  });
}

function loadGtm() {
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  return injectScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`, {
    id: 'bazaar-gtm',
    defer: true
  });
}

function loadMetaPixel() {
  return injectScript('https://connect.facebook.net/en_US/fbevents.js', {
    id: 'bazaar-meta-pixel',
    defer: true
  }).then(() => {
    if (window.fbq) window.fbq.loaded = true;
    window.fbq('init', META_PIXEL_ID);
    window.fbq('track', 'PageView');
  });
}

function shouldLoadOneSignal() {
  const host = window.location.hostname;
  const isProduction = host === 'bazaar-pk.com' || host === 'www.bazaar-pk.com';
  const path = window.location.pathname || '';
  return isProduction && !path.startsWith('/admin') && !path.startsWith('/staff');
}

function loadOneSignal() {
  if (!shouldLoadOneSignal()) return Promise.resolve();

  window.OneSignalDeferred.push(async function initOneSignal(OneSignal) {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
      serviceWorkerPath: '/OneSignalSDKWorker.js',
      notifyButton: { enable: true }
    });

    window.setTimeout(() => {
      OneSignal.Slidedown.promptPush();
    }, 2500);
  });

  return injectScript('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js', {
    id: 'bazaar-onesignal',
    defer: true
  });
}

/** Load trackers one-by-one during idle slices — never all parse together on main thread. */
function loadAllThirdPartyScripts() {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  installThirdPartyStubs();

  loadPromise = new Promise((resolve) => {
    const runChain = () => {
      loadGtm()
        .catch(() => {})
        .then(
          () =>
            new Promise((next) => {
              scheduleOnIdle(() => {
                loadGa4()
                  .catch(() => {})
                  .finally(next);
              });
            })
        )
        .then(
          () =>
            new Promise((next) => {
              scheduleOnIdle(() => {
                loadMetaPixel()
                  .catch(() => {})
                  .finally(next);
              });
            })
        )
        .then(
          () =>
            new Promise((next) => {
              scheduleOnIdle(() => {
                loadOneSignal()
                  .catch(() => {})
                  .finally(next);
              });
            })
        )
        .then(() => {
          loaded = true;
          window.__BAZAAR_THIRD_PARTY_READY__ = true;
          window.dispatchEvent(new Event('bazaar:third-party-ready'));
          resolve();
        });
    };

    scheduleOnIdle(runChain);
  });

  return loadPromise;
}

/**
 * After window load, inject GTM / GA4 / Meta / OneSignal during idle time only.
 */
export function scheduleDeferredThirdPartyScripts() {
  installThirdPartyStubs();

  let cancelled = false;

  const start = () => {
    if (cancelled || loaded) return;
    void loadAllThirdPartyScripts();
  };

  const onWindowLoad = () => {
    if (cancelled) return;
    scheduleOnIdle(start);
  };

  if (typeof document !== 'undefined' && document.readyState === 'complete') {
    onWindowLoad();
  } else if (typeof window !== 'undefined') {
    window.addEventListener('load', onWindowLoad, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', onWindowLoad);
  };
}

export function isThirdPartyReady() {
  return loaded;
}

export function whenThirdPartyReady() {
  if (loaded) return Promise.resolve();
  return new Promise((resolve) => {
    const onReady = () => {
      window.removeEventListener('bazaar:third-party-ready', onReady);
      resolve();
    };
    window.addEventListener('bazaar:third-party-ready', onReady);
    if (loadPromise) loadPromise.then(resolve);
  });
}
