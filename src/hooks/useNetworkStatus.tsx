import { useState, useEffect, useCallback } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Dispatch event for components to react to reconnection
        window.dispatchEvent(new CustomEvent('network-reconnected'));
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }
    
    // Additional connectivity check via fetch
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch {
      return navigator.onLine; // Fallback to browser state
    }
  }, []);

  return { isOnline, wasOffline, checkConnection };
};
