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
    <div className={`rounded-lg overflow-hidden border border-border bg-card ${className}`}>
      <iframe
        title="Exolix Swap Widget"
        src={src}
        width="100%"
        height="376px"
        frameBorder="0"
        scrolling="yes"
        className="w-full"
      />
    </div>
  );
};

export default ExolixWidget;
