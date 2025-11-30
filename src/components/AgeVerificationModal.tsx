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
import { AlertCircle } from "lucide-react";

interface AgeVerificationModalProps {
  open: boolean;
  onVerified: () => void;
  onDeclined: () => void;
}

export const AgeVerificationModal = ({
  open,
  onVerified,
  onDeclined,
}: AgeVerificationModalProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleVerify = () => {
    if (agreed) {
      // Store verification in session storage
      sessionStorage.setItem("age_verified", "true");
      onVerified();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onDeclined()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Age Verification Required
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>
              This category contains adult content and age-restricted products.
            </p>
            <p>
              By continuing, you confirm that you are at least 18 years of age
              (or the age of majority in your jurisdiction) and agree to view
              adult content.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start space-x-2 py-4">
          <Checkbox
            id="age-verify"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label
            htmlFor="age-verify"
            className="text-sm font-normal leading-relaxed cursor-pointer"
          >
            I am 18 years or older and I agree to view age-restricted content
          </Label>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onDeclined}
            className="w-full sm:w-auto"
          >
            Exit
          </Button>
          <Button
            type="button"
            onClick={handleVerify}
            disabled={!agreed}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
