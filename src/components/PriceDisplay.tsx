import { useExchangeRate } from '@/hooks/useExchangeRate';

interface PriceDisplayProps {
  usdAmount: number;
  className?: string;
  showBrackets?: boolean;
}

export const PriceDisplay = ({ usdAmount, className = '', showBrackets = true }: PriceDisplayProps) => {
  const { usdToXmr, loading } = useExchangeRate();
  const xmrAmount = usdToXmr(usdAmount);

  if (loading) {
    return <span className={className}>${usdAmount.toFixed(2)}</span>;
  }

  return (
    <span className={className}>
      ${usdAmount.toFixed(2)}
      {showBrackets && (
        <span className="text-muted-foreground ml-1">
          ({xmrAmount.toFixed(4)} XMR)
        </span>
      )}
    </span>
  );
};
