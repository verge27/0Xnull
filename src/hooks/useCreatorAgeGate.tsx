import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "creator_age_verified";

export const useCreatorAgeGate = () => {
  const [isVerified, setIsVerified] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEY) === "true";
  });
  const [showModal, setShowModal] = useState<boolean>(false);

  useEffect(() => {
    // Check on mount if verification is needed
    if (!isVerified) {
      setShowModal(true);
    }
  }, [isVerified]);

  const verify = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, "true");
    setIsVerified(true);
    setShowModal(false);
  }, []);

  const decline = useCallback(() => {
    // Redirect away from the site
    window.location.href = "https://google.com";
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
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
