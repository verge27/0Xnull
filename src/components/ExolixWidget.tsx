interface ExolixWidgetProps {
  fromCoin?: string;
  fromNetwork?: string;
  toCoin?: string;
  toNetwork?: string;
  amount?: number;
  className?: string;
}

const ExolixWidget = ({
  fromCoin = "BTC",
  fromNetwork = "BTC",
  toCoin = "XMR",
  toNetwork = "XMR",
  amount = 0.01,
  className = "",
}: ExolixWidgetProps) => {
  const widgetToken = "NyyJr7PX4ChR0fUlnpALCqFUOXlcnQcGDgfEuxCl9bZ290Rsf1ylj84FgIspRsFh";
  const src = `https://exolix.com/widget/${fromCoin}:${fromNetwork}-${toCoin}:${toNetwork}?a=${amount}&locale=en&t=${widgetToken}`;

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="rounded-lg overflow-hidden border border-border bg-card max-w-[560px] w-full">
        <iframe
          title="Exolix Swap Widget"
          src={src}
          width="560"
          height="376"
          frameBorder="0"
          scrolling="yes"
          className="w-full max-w-full"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  );
};

export default ExolixWidget;
