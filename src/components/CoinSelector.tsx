import { useState } from 'react';
import { Check, ChevronsUpDown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Coin {
  id: string;
  ticker: string;
  name: string;
  network: string;
  memo: boolean;
  image: string | null;
  minimum: number;
  maximum: number;
}

interface PriorityCoin extends Coin {
  preferredLabel: string;
}

interface CoinSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  priorityCoins: PriorityCoin[];
  otherCoins: Coin[];
  placeholder?: string;
  isPrivacyCoin: (ticker: string) => boolean;
}

export function CoinSelector({
  value,
  onValueChange,
  priorityCoins,
  otherCoins,
  placeholder = "Select coin...",
  isPrivacyCoin,
}: CoinSelectorProps) {
  const [open, setOpen] = useState(false);

  const selectedCoin = [...priorityCoins, ...otherCoins].find(
    (coin) => coin.ticker === value
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between"
        >
          {selectedCoin ? (
            <div className="flex items-center gap-2">
              {selectedCoin.ticker === 'xmr' && (
                <Zap className="h-3 w-3 text-primary" />
              )}
              <span className="font-medium">{selectedCoin.ticker.toUpperCase()}</span>
              <span className="text-muted-foreground text-xs">({selectedCoin.network})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search coins..." />
          <CommandList>
            <CommandEmpty>No coin found.</CommandEmpty>
            <CommandGroup heading={
              <span className="flex items-center gap-1 text-primary">
                <Star className="h-3 w-3" /> Popular
              </span>
            }>
              {priorityCoins.map((coin) => (
                <CommandItem
                  key={`${coin.ticker}-${coin.network}`}
                  value={`${coin.ticker} ${coin.name} ${coin.network}`}
                  onSelect={() => {
                    onValueChange(coin.ticker);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === coin.ticker ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {coin.ticker.toLowerCase() === 'xmr' && (
                      <Zap className="h-3 w-3 text-primary" />
                    )}
                    <span className="font-medium">{coin.ticker.toUpperCase()}</span>
                    <span className="text-muted-foreground text-xs">({coin.network})</span>
                    {isPrivacyCoin(coin.ticker) && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Privacy</Badge>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Other Coins">
              {otherCoins.map((coin) => (
                <CommandItem
                  key={coin.ticker}
                  value={`${coin.ticker} ${coin.name}`}
                  onSelect={() => {
                    onValueChange(coin.ticker);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === coin.ticker ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{coin.ticker.toUpperCase()} - {coin.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
