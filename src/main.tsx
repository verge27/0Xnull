import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

const renderApp = () => {
  if (!rootElement) return;
  createRoot(rootElement).render(<App />);
};

const registerAppServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  const registerSW = () => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
          if (registration) {
            setInterval(() => {
              registration.update();
            }, 60 * 60 * 1000);
          }
        },
        onNeedRefresh() {
          updateSW(true);
        },
        onOfflineReady() {
          console.log('App ready for offline use');
        },
      });
    }).catch(() => {
      // SW registration failed, not critical
    });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSW, { timeout: 3000 });
  } else {
    setTimeout(registerSW, 2000);
  }
};

const bypassStaleServiceWorkerForStaticRoutes = async () => {
  const pathname = window.location.pathname;
  const isStaticFileRoute = /^\/.*\.[a-z0-9]+$/i.test(pathname);

  if (!isStaticFileRoute || !('serviceWorker' in navigator)) {
    return false;
  }

  const bypassKey = `sw-bypass:${pathname}`;
  const hasRetried = sessionStorage.getItem(bypassKey) === '1';

  if (hasRetried) {
    sessionStorage.removeItem(bypassKey);
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  if (registrations.length === 0) {
    return false;
  }

  sessionStorage.setItem(bypassKey, '1');
  await Promise.all(registrations.map((registration) => registration.unregister()));
  window.location.replace(window.location.href);
  return true;
};

void (async () => {
  const isRecoveringStaticRoute = await bypassStaleServiceWorkerForStaticRoutes();
  if (isRecoveringStaticRoute) return;

  renderApp();
  registerAppServiceWorker();
})();