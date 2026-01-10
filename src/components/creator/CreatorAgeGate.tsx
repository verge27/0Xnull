import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield } from "lucide-react";
import { Link } from "react-router-dom";

interface CreatorAgeGateProps {
  open: boolean;
  onVerified: () => void;
  onDeclined: () => void;
}

export const CreatorAgeGate = ({
  open,
  onVerified,
  onDeclined,
}: CreatorAgeGateProps) => {
  const [agreements, setAgreements] = useState({
    age: false,
    legal: false,
    consent: false,
    terms: false,
  });

  const allAgreed = Object.values(agreements).every(Boolean);

  const handleVerify = () => {
    if (allAgreed) {
      sessionStorage.setItem("creator_age_verified", "true");
      onVerified();
    }
  };

  const handleExit = () => {
    window.location.href = "https://google.com";
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDeclined()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            ADULTS ONLY (18+)
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            This website contains adult content including explicit sexual material.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center mb-4">
            By entering, you confirm that:
          </p>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="age-confirm"
                checked={agreements.age}
                onCheckedChange={(checked) =>
                  setAgreements((prev) => ({ ...prev, age: checked as boolean }))
                }
              />
              <Label htmlFor="age-confirm" className="text-sm leading-relaxed cursor-pointer">
                You are at least 18 years of age (or the age of majority in your jurisdiction, whichever is higher)
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="legal-confirm"
                checked={agreements.legal}
                onCheckedChange={(checked) =>
                  setAgreements((prev) => ({ ...prev, legal: checked as boolean }))
                }
              />
              <Label htmlFor="legal-confirm" className="text-sm leading-relaxed cursor-pointer">
                Adult content is legal in your jurisdiction
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent-confirm"
                checked={agreements.consent}
                onCheckedChange={(checked) =>
                  setAgreements((prev) => ({ ...prev, consent: checked as boolean }))
                }
              />
              <Label htmlFor="consent-confirm" className="text-sm leading-relaxed cursor-pointer">
                You consent to viewing adult content
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms-confirm"
                checked={agreements.terms}
                onCheckedChange={(checked) =>
                  setAgreements((prev) => ({ ...prev, terms: checked as boolean }))
                }
              />
              <Label htmlFor="terms-confirm" className="text-sm leading-relaxed cursor-pointer">
                You have read and agree to our{" "}
                <Link to="/creator/terms" className="text-primary hover:underline" target="_blank">
                  Terms of Service
                </Link>
                ,{" "}
                <Link to="/creator/privacy" className="text-primary hover:underline" target="_blank">
                  Privacy Policy
                </Link>
                , and{" "}
                <Link to="/creator/content-policy" className="text-primary hover:underline" target="_blank">
                  Content Policy
                </Link>
              </Label>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground text-center">
              If you are under 18, please leave this site immediately.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExit}
            className="w-full sm:w-auto"
          >
            EXIT
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={!allAgreed}
            className="w-full sm:w-auto"
          >
            I AM 18+ — ENTER
          </Button>
        </DialogFooter>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>
              0xNull Creators is committed to preventing minors from accessing adult content.
              We actively report any child sexual abuse material to law enforcement.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
