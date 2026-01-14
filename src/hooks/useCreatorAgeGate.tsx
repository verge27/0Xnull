import { useState, useEffect, useCallback } from "react";
import { creatorApi } from "@/services/creatorApi";

const STORAGE_KEY = "creator_age_verified";

// Safe sessionStorage access (handles SSR, private browsing, etc.)
const safeGetSessionItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(key);
    }
  } catch (e) {
    console.warn('[useCreatorAgeGate] sessionStorage access failed:', e);
  }
  return null;
};

const safeSetSessionItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('[useCreatorAgeGate] sessionStorage write failed:', e);
  }
};

const safeRemoveSessionItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('[useCreatorAgeGate] sessionStorage remove failed:', e);
  }
};

export const useCreatorAgeGate = () => {
  // Check if user is authenticated as a creator - skip age gate if so
  const isCreatorAuthenticated = creatorApi.isAuthenticated();
  
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    // Skip age gate for authenticated creators
    if (isCreatorAuthenticated) return true;
    return safeGetSessionItem(STORAGE_KEY) === "true";
  });
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    // Skip age gate for authenticated creators
    if (isCreatorAuthenticated) {
      setIsVerified(true);
      setShowModal(false);
      return;
    }
    
    // Check on mount if verification is needed
    if (!isVerified) {
      setShowModal(true);
    }
  }, [isVerified, isCreatorAuthenticated]);

  const verify = useCallback(() => {
    safeSetSessionItem(STORAGE_KEY, "true");
    setIsVerified(true);
    setShowModal(false);
  }, []);

  const decline = useCallback(() => {
    // Exit creators content but keep user in-app (avoid cross-origin navigation issues, esp. Safari)
    if (typeof window !== 'undefined') {
      window.location.href = "/";
    }
  }, []);

  const reset = useCallback(() => {
    safeRemoveSessionItem(STORAGE_KEY);
    setIsVerified(false);
    setShowModal(true);
  }, []);

  return {
    isVerified,
    showModal,
    verify,
    decline,
    reset,
  };
};
