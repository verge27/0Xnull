import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { listingSchema } from '@/lib/validation';
import { useCurrencyConversion, SUPPORTED_CURRENCIES } from '@/hooks/useCurrencyConversion';
import { ImageUpload } from '@/components/ImageUpload';
import { CountrySelect } from '@/components/CountrySelect';
import { Loader2 } from 'lucide-react';
import { ALL_CATEGORIES } from '@/lib/categories';
import { ListingErrorBoundary } from '@/components/ListingErrorBoundary';

const NewListingContent = () => {
  const { user } = useAuth();
  const { createListing } = useListings();
  const { convertToUsd, loading: conversionLoading } = useCurrencyConversion();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [shippingCountries, setShippingCountries] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    priceCurrency: 'USD',
    category: '',
    secondaryCategory: '',
    tertiaryCategory: '',
    stock: '',
    shippingPrice: '',
    shippingCurrency: 'USD'
  });
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [convertedShipping, setConvertedShipping] = useState<number | null>(null);

  // Auto-convert price when currency or amount changes
  useEffect(() => {
    const convertPrice = async () => {
      const amount = parseFloat(formData.price);
      if (isNaN(amount) || amount <= 0) {
        setConvertedPrice(null);
        return;
      }
      
      if (formData.priceCurrency === 'USD') {
        setConvertedPrice(amount);
      } else {
        const usdAmount = await convertToUsd(amount, formData.priceCurrency);
        setConvertedPrice(usdAmount);
      }
    };
    
    const debounce = setTimeout(convertPrice, 300);
    return () => clearTimeout(debounce);
  }, [formData.price, formData.priceCurrency, convertToUsd]);

  // Auto-convert shipping when currency or amount changes
  useEffect(() => {
    const convertShipping = async () => {
      const amount = parseFloat(formData.shippingPrice);
      if (isNaN(amount) || amount < 0) {
        setConvertedShipping(0);
        return;
      }
      
      if (formData.shippingCurrency === 'USD') {
        setConvertedShipping(amount);
      } else {
        const usdAmount = await convertToUsd(amount, formData.shippingCurrency);
        setConvertedShipping(usdAmount ?? 0);
      }
    };
    
    const debounce = setTimeout(convertShipping, 300);
    return () => clearTimeout(debounce);
  }, [formData.shippingPrice, formData.shippingCurrency, convertToUsd]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    setSubmitError(null);

    // Validate all fields before submission
    const validationErrors: string[] = [];

    if (!formData.title?.trim()) {
      validationErrors.push('Title is required');
    }
    if (!formData.description?.trim()) {
      validationErrors.push('Description is required');
    }
    if (convertedPrice === null || convertedPrice <= 0) {
      validationErrors.push('Please enter a valid price');
    }
    if (!formData.stock || parseInt(formData.stock) < 1) {
      validationErrors.push('Stock must be at least 1');
    }
    if (!formData.category) {
      validationErrors.push('Please select a category');
    }

    if (validationErrors.length > 0) {
      validationErrors.forEach(err => toast.error(err));
      return;
    }

    // Validate inputs with schema
    try {
      listingSchema.parse({
        title: formData.title,
        description: formData.description,
        priceUsd: convertedPrice,
        category: formData.category,
        imageUrl: images[0] || ''
      });
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Invalid input');
      return;
    }

    setIsSubmitting(true);
    console.log('[NewListing] Creating listing...');

    try {
      const result = await createListing({
        title: formData.title.trim(),
        description: formData.description.trim(),
        price_usd: convertedPrice!,
        category: formData.category,
        secondary_category: formData.secondaryCategory || null,
        tertiary_category: formData.tertiaryCategory || null,
        images: images,
        stock: parseInt(formData.stock),
        shipping_price_usd: convertedShipping ?? 0,
        shipping_countries: shippingCountries.length > 0 ? shippingCountries : null,
        condition: 'new'
      });

      if (result) {
        console.log('[NewListing] Listing created successfully:', result.id);
        toast.success('Listing created successfully!');
        navigate('/sell');
      } else {
        console.error('[NewListing] Failed to create listing - no result returned');
        setSubmitError('Failed to create listing. Please try again.');
      }
    } catch (err: any) {
      console.error('[NewListing] Error creating listing:', err);
      setSubmitError(err.message || 'Failed to create listing');
      toast.error(err.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
      CAD: 'C$', AUD: 'A$', CHF: 'Fr', INR: '₹', MXN: '$',
      BRL: 'R$', RUB: '₽',
    };
    return symbols[code] || code;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Create New Listing</h1>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Premium Leather Wallet"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={4}
                />
              </div>

              <div>
                <Label>Price *</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.priceCurrency} 
                    onValueChange={(value) => setFormData({ ...formData, priceCurrency: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD" className="font-semibold">USD ($)</SelectItem>
                      <div className="px-2 py-1 text-xs text-muted-foreground">Fiat</div>
                      {SUPPORTED_CURRENCIES.filter(c => c.type === 'fiat' && c.code !== 'USD').map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({getCurrencySymbol(currency.code)})
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs text-muted-foreground mt-1">Crypto</div>
                      {SUPPORTED_CURRENCIES.filter(c => c.type === 'crypto').map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="any"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
                {formData.priceCurrency !== 'USD' && formData.price && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                    {conversionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : convertedPrice !== null ? (
                      <>≈ ${convertedPrice.toFixed(2)} USD</>
                    ) : (
                      <span className="text-destructive">Conversion unavailable</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>Shipping</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.shippingCurrency} 
                    onValueChange={(value) => setFormData({ ...formData, shippingCurrency: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD" className="font-semibold">USD ($)</SelectItem>
                      <div className="px-2 py-1 text-xs text-muted-foreground">Fiat</div>
                      {SUPPORTED_CURRENCIES.filter(c => c.type === 'fiat' && c.code !== 'USD').map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({getCurrencySymbol(currency.code)})
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1 text-xs text-muted-foreground mt-1">Crypto</div>
                      {SUPPORTED_CURRENCIES.filter(c => c.type === 'crypto').map(currency => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="any"
                    value={formData.shippingPrice}
                    onChange={(e) => setFormData({ ...formData, shippingPrice: e.target.value })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
                {formData.shippingCurrency !== 'USD' && formData.shippingPrice && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                    {conversionLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : convertedShipping !== null ? (
                      <>≈ ${convertedShipping.toFixed(2)} USD</>
                    ) : (
                      <span className="text-destructive">Conversion unavailable</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="category">Primary Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {ALL_CATEGORIES.map((category) => (
                      <SelectGroup key={category.id}>
                        <SelectLabel className="font-semibold text-foreground">{category.name}</SelectLabel>
                        {category.children?.map((child) => (
                          <SelectItem key={child.id} value={child.slug}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="secondaryCategory">Secondary Category (Optional)</Label>
                <Select value={formData.secondaryCategory} onValueChange={(value) => setFormData({ ...formData, secondaryCategory: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a secondary category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="">None</SelectItem>
                    {ALL_CATEGORIES.map((category) => (
                      <SelectGroup key={category.id}>
                        <SelectLabel className="font-semibold text-foreground">{category.name}</SelectLabel>
                        {category.children?.map((child) => (
                          <SelectItem key={child.id} value={child.slug}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tertiaryCategory">Tertiary Category (Optional)</Label>
                <Select value={formData.tertiaryCategory} onValueChange={(value) => setFormData({ ...formData, tertiaryCategory: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tertiary category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="">None</SelectItem>
                    {ALL_CATEGORIES.map((category) => (
                      <SelectGroup key={category.id}>
                        <SelectLabel className="font-semibold text-foreground">{category.name}</SelectLabel>
                        {category.children?.map((child) => (
                          <SelectItem key={child.id} value={child.slug}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ships To</Label>
                <CountrySelect value={shippingCountries} onChange={setShippingCountries} />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for no shipping restrictions</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <ImageUpload images={images} onImagesChange={setImages} />

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || !formData.category || (formData.priceCurrency !== 'USD' && convertedPrice === null)}>
                {isSubmitting ? 'Creating...' : 'Create Listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const NewListing = () => (
  <ListingErrorBoundary fallbackPath="/sell">
    <NewListingContent />
  </ListingErrorBoundary>
);

export default NewListing;
