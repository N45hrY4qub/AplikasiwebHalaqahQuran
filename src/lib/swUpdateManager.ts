type SwUpdateListener = (waitingWorker: ServiceWorker | null) => void;

let currentWaitingWorker: ServiceWorker | null = null;
let currentRegistration: ServiceWorkerRegistration | null = null;
const listeners = new Set<SwUpdateListener>();
let isInitialized = false;

const notifyListeners = () => {
  listeners.forEach((listener) => {
    try {
      listener(currentWaitingWorker);
    } catch (err) {
      console.warn('[PWA] Update listener error:', err);
    }
  });
};

const attachRegistrationListeners = (registration: ServiceWorkerRegistration) => {
  currentRegistration = registration;

  // If a waiting worker is already present when registering/mounting, notify immediately
  if (registration.waiting) {
    currentWaitingWorker = registration.waiting;
    notifyListeners();
  }

  // Detect newly discovered Service Worker updates
  registration.addEventListener('updatefound', () => {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version installed and waiting in the background — do NOT force reload
        currentWaitingWorker = registration.waiting || newWorker;
        notifyListeners();
      }
    });
  });
};

export const registerServiceWorker = () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (isInitialized) return;
  isInitialized = true;

  const isInIframe = window.self !== window.top;
  const isDev = Boolean(import.meta.env.DEV);

  if (isDev || isInIframe) {
    // In development or preview iframes, unregister existing service workers to avoid reload loops and caching conflicts
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});
    return;
  }

  const doRegister = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);
        attachRegistrationListeners(registration);

        // Gently check for SW updates when user returns to the tab (never forces reload)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((error) => {
        console.warn('[PWA] Service Worker registration failed:', error);
      });
  };

  if (document.readyState === 'complete') {
    doRegister();
  } else {
    window.addEventListener('load', doRegister, { once: true });
  }
};

export const subscribeToSwUpdate = (listener: SwUpdateListener): (() => void) => {
  listeners.add(listener);

  // Sync current waiting worker immediately
  if (currentWaitingWorker) {
    listener(currentWaitingWorker);
  } else if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => {
        if (reg && reg.waiting) {
          currentRegistration = reg;
          currentWaitingWorker = reg.waiting;
          listener(currentWaitingWorker);
        }
      })
      .catch(() => {});
  }

  return () => {
    listeners.delete(listener);
  };
};

export const applySwUpdate = (workerOverride?: ServiceWorker | null) => {
  const targetWorker = workerOverride || currentWaitingWorker || currentRegistration?.waiting;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    window.location.reload();
    return;
  }

  if (!targetWorker) {
    window.location.reload();
    return;
  }

  let hasReloaded = false;
  const triggerReload = () => {
    if (hasReloaded) return;
    hasReloaded = true;
    window.location.reload();
  };

  // Reload once the new Service Worker takes control after SKIP_WAITING
  navigator.serviceWorker.addEventListener('controllerchange', triggerReload, { once: true });

  // Send SKIP_WAITING to the waiting Service Worker
  targetWorker.postMessage({ type: 'SKIP_WAITING' });

  // Safety fallback in case controllerchange does not fire quickly
  window.setTimeout(triggerReload, 1500);
};
