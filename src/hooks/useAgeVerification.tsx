import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AGE_RESTRICTED_CATEGORIES = ['adult-intimacy'];

export const useAgeVerification = (categorySlug?: string) => {
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!categorySlug) return;

    const isAgeRestricted = AGE_RESTRICTED_CATEGORIES.includes(categorySlug);
    if (!isAgeRestricted) {
      setIsVerified(true);
      return;
    }

    // Check session storage for existing verification
    const verified = sessionStorage.getItem("age_verified") === "true";
    setIsVerified(verified);
    setNeedsVerification(!verified);
  }, [categorySlug]);

  const handleVerified = () => {
    setIsVerified(true);
    setNeedsVerification(false);
  };

  const handleDeclined = () => {
    setNeedsVerification(false);
    navigate("/browse");
  };

  return {
    needsVerification,
    isVerified,
    handleVerified,
    handleDeclined,
  };
};
