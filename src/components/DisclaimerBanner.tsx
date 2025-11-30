import { AlertTriangle, Info, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type DisclaimerType = 'research' | 'wellness' | 'legal' | 'privacy';

interface DisclaimerBannerProps {
  type: DisclaimerType;
  message?: string;
  className?: string;
}

const disclaimerConfig: Record<DisclaimerType, {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  defaultMessage: string;
  variant?: 'default' | 'destructive';
}> = {
  research: {
    icon: AlertTriangle,
    title: "Research Purposes Only",
    defaultMessage: "Products in this category are sold for research purposes only. Not for human consumption. Consult a healthcare provider before use.",
    variant: 'destructive',
  },
  wellness: {
    icon: Info,
    title: "Health & Wellness Notice",
    defaultMessage: "Tari Market does not make medical claims or provide medical advice. Buyers are responsible for compliance with local regulations. Consult a healthcare provider before use.",
  },
  legal: {
    icon: Shield,
    title: "Legal Compliance Notice",
    defaultMessage: "You are responsible for understanding and complying with laws in your jurisdiction. Some products may be restricted or prohibited in certain areas.",
  },
  privacy: {
    icon: Shield,
    title: "Privacy & Discretion",
    defaultMessage: "All orders ship in plain, unmarked packaging. Your privacy is our priority. No product details appear on shipping labels or billing statements.",
  },
};

export const DisclaimerBanner = ({
  type,
  message,
  className = "",
}: DisclaimerBannerProps) => {
  const config = disclaimerConfig[type];
  const Icon = config.icon;

  return (
    <Alert variant={config.variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{config.title}</AlertTitle>
      <AlertDescription className="text-sm">
        {message || config.defaultMessage}
      </AlertDescription>
    </Alert>
  );
};
