import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Render app immediately
createRoot(document.getElementById("root")!).render(<App />);

// Defer service worker registration until after initial render
if ('serviceWorker' in navigator) {
  // Use requestIdleCallback to register SW when browser is idle
  const registerSW = () => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: false,
        onRegisteredSW(swUrl, r) {
          // Check for updates periodically
          if (r) {
            setInterval(() => {
              r.update();
            }, 60 * 60 * 1000); // Check hourly
          }
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
}