import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COUNTRIES, getCountryName } from '@/lib/countries';

interface CountrySelectProps {
  value: string[];
  onChange: (countries: string[]) => void;
}

export const CountrySelect = ({ value, onChange }: CountrySelectProps) => {
  const [open, setOpen] = useState(false);

  const toggleCountry = (code: string) => {
    if (code === 'WORLDWIDE') {
      onChange(value.includes('WORLDWIDE') ? [] : ['WORLDWIDE']);
      return;
    }
    
    // Remove WORLDWIDE if selecting specific countries
    const filtered = value.filter(c => c !== 'WORLDWIDE');
    
    if (filtered.includes(code)) {
      onChange(filtered.filter(c => c !== code));
    } else {
      onChange([...filtered, code]);
    }
  };

  const removeCountry = (code: string) => {
    onChange(value.filter(c => c !== code));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length === 0
              ? "Select countries (optional)"
              : `${value.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.name}
                    onSelect={() => toggleCountry(country.code)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(country.code) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1">
              {getCountryName(code)}
              <button
                type="button"
                onClick={() => removeCountry(code)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
