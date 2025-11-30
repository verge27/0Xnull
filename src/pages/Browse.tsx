import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { MarketInsights } from '@/components/MarketInsights';
import { CommentsSection } from '@/components/CommentsSection';
import { SiteAssistant } from '@/components/SiteAssistant';
import { getListings } from '@/lib/data';
import { xmrbazaarListings } from '@/lib/xmrbazaar';
import { freakInTheSheetsListings } from '@/lib/partners/freakInTheSheets';
import { peptidesUKPartnerListings } from '@/lib/partners/peptidesUK';
import { ukPeptidesPartnerListings } from '@/lib/partners/ukPeptides';
import { ReferralListingCard } from '@/components/ReferralListingCard';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ALL_CATEGORIES, getCategoryPath, type Category } from '@/lib/categories';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const demoListings = getListings();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Combine all listings (XMRBazaar first, then partner referrals, then demo)
  const listings: any[] = [
    ...xmrbazaarListings.map(xmr => ({
      ...xmr,
      sellerId: `xmr-${xmr.seller.name}`,
      images: xmr.images,
      stock: 999,
      shippingPriceUsd: 0,
      status: 'active' as const,
      condition: 'new' as const,
      createdAt: new Date().toISOString(),
      isXMRBazaar: true,
      xmrbazaarUrl: xmr.xmrbazaarUrl,
      seller: xmr.seller
    })),
    ...freakInTheSheetsListings.map(item => ({
      ...item,
      id: item.id || `fits-${Math.random()}`,
      title: item.title || '',
      description: item.description || '',
      priceUsd: item.priceUsd || 0,
      category: item.category || 'adult-intimacy',
      sellerId: 'freak-in-the-sheets',
      images: item.images || ['/placeholder.svg'],
      stock: item.stock || 99,
      shippingPriceUsd: item.shippingPriceUsd || 0,
      status: 'active' as const,
      condition: item.condition || 'new' as const,
      createdAt: item.createdAt || new Date().toISOString(),
      referralUrl: item.referralUrl,
      fulfillment: item.fulfillment,
      discreteShipping: item.discreteShipping,
      isPartner: true,
      partnerName: 'Freak In The Sheets'
    })),
    ...peptidesUKPartnerListings.map(item => ({
      ...item,
      id: item.id || `puk-${Math.random()}`,
      title: item.title || '',
      description: item.description || '',
      priceUsd: item.priceUsd || 0,
      category: item.category || 'health-wellness',
      sellerId: 'peptides-uk',
      images: item.images || ['/placeholder.svg'],
      stock: item.stock || 99,
      shippingPriceUsd: item.shippingPriceUsd || 0,
      status: 'active' as const,
      condition: item.condition || 'new' as const,
      createdAt: item.createdAt || new Date().toISOString(),
      referralUrl: item.referralUrl,
      fulfillment: item.fulfillment,
      disclaimer: item.disclaimer,
      discreteShipping: item.discreteShipping,
      coaAvailable: item.coaAvailable,
      isPartner: true,
      partnerName: 'Peptides UK'
    })),
    ...ukPeptidesPartnerListings.map(item => ({
      ...item,
      id: item.id || `ukp-${Math.random()}`,
      title: item.title || '',
      description: item.description || '',
      priceUsd: item.priceUsd || 0,
      category: item.category || 'health-wellness',
      sellerId: 'uk-peptides',
      images: item.images || ['/placeholder.svg'],
      stock: item.stock || 99,
      shippingPriceUsd: item.shippingPriceUsd || 0,
      status: 'active' as const,
      condition: item.condition || 'new' as const,
      createdAt: item.createdAt || new Date().toISOString(),
      referralUrl: item.referralUrl,
      fulfillment: item.fulfillment,
      disclaimer: item.disclaimer,
      discreteShipping: item.discreteShipping,
      coaAvailable: item.coaAvailable,
      isPartner: true,
      partnerName: 'UK-Peptides'
    })),
    ...demoListings
  ];

  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  
  const categorySlug = searchParams.get('category');
  const urlSearchQuery = searchParams.get('q');
  const categoryPath = categorySlug ? getCategoryPath(categorySlug) : [];

  useEffect(() => {
    // Auto-expand parent categories when a category is selected
    if (categoryPath.length > 0) {
      const newOpenCategories = new Set<number>();
      categoryPath.forEach(cat => {
        newOpenCategories.add(cat.id);
        // Find parent and add it too
        ALL_CATEGORIES.forEach(topCat => {
          if (topCat.id === cat.id || topCat.children?.some(c => c.id === cat.id)) {
            newOpenCategories.add(topCat.id);
          }
        });
      });
      setOpenCategories(newOpenCategories);
    }
  }, [categorySlug]);

  const toggleCategory = (categoryId: number) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const selectCategory = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  // Apply filters
  let filteredListings = listings.filter(listing => {
    const searchTerm = urlSearchQuery || searchQuery;
    const matchesSearch = !searchTerm || 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchTerm.toLowerCase());
    // Match both category and subcategory
    const matchesCategory = !categorySlug || 
      listing.category === categorySlug || 
      listing.subcategory === categorySlug;
    const matchesPrice = listing.priceUsd >= priceRange[0] && listing.priceUsd <= priceRange[1];
    const matchesCondition = selectedCondition === 'all' || listing.condition === selectedCondition;
    
    return matchesSearch && matchesCategory && matchesPrice && matchesCondition && listing.status === 'active';
  });

  // Apply sorting
  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-low-high':
        return a.priceUsd - b.priceUsd;
      case 'price-high-low':
        return b.priceUsd - a.priceUsd;
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'relevance':
      default:
        return 0;
    }
  });

  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setPriceRange([0, 500]);
    setSelectedCondition('all');
    setSortBy('relevance');
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isOpen = openCategories.has(category.id);
    const isSelected = categorySlug === category.slug;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} style={{ paddingLeft: `${level * 12}px` }}>
        {hasChildren ? (
          <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category.id)}>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger asChild>
                <button className="p-1 hover:bg-muted rounded">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
              <button
                onClick={() => selectCategory(category.slug)}
                className={`flex-1 text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground font-medium' : ''
                }`}
              >
                {category.name}
              </button>
            </div>
            <CollapsibleContent>
              <div className="mt-1 space-y-1">
                {category.children?.map(child => renderCategory(child, level + 1))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <button
            onClick={() => selectCategory(category.slug)}
            className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
              isSelected ? 'bg-primary text-primary-foreground font-medium' : ''
            }`}
          >
            {category.name}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          {urlSearchQuery ? (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">Results for "{urlSearchQuery}"</h1>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">
                {sortedListings.length} {sortedListings.length === 1 ? 'result' : 'results'} found
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-2">Browse Marketplace</h1>
              <p className="text-muted-foreground">
                Discover products and services from privacy-focused sellers
              </p>
            </>
          )}
          
          
          {/* Breadcrumb Navigation */}
          {categoryPath.length > 0 && (
            <Breadcrumb className="mt-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/browse" onClick={(e) => { e.preventDefault(); selectCategory(null); }}>
                      All Categories
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {categoryPath.map((cat, index) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {index === categoryPath.length - 1 ? (
                        <BreadcrumbPage>{cat.name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={`/browse?category=${cat.slug}`} onClick={(e) => { e.preventDefault(); selectCategory(cat.slug); }}>
                            {cat.name}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Categories</h2>
                  {categorySlug && (
                    <button
                      onClick={() => selectCategory(null)}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-[600px] overflow-y-auto">
                  <button
                    onClick={() => selectCategory(null)}
                    className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors ${
                      !categorySlug ? 'bg-primary text-primary-foreground font-medium' : ''
                    }`}
                  >
                    All Categories
                  </button>
                  {ALL_CATEGORIES.map(category => renderCategory(category))}
                </div>

                {/* Filters */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                    </h2>
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Price Range */}
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">
                      Price Range (USD)
                    </label>
                    <div className="space-y-2">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={500}
                        step={10}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">
                      Condition
                    </label>
                    <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border z-50">
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Sort & Results Count */}
            <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-muted-foreground">
                {sortedListings.length} {sortedListings.length === 1 ? 'item' : 'items'}
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px] bg-secondary/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="relevance">Sort by Relevance</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {categoryPath.length > 0 && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold">
                    {categoryPath[categoryPath.length - 1].name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
                  </p>
                </div>
                
                {/* Research Disclaimer for Health & Wellness categories */}
                {(categorySlug === 'health-wellness' || 
                  categorySlug === 'peptides-research' || 
                  categorySlug === 'nootropics-cognitive') && (
                  <DisclaimerBanner 
                    type="research" 
                    className="mb-6"
                  />
                )}
              </>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedListings.map(listing => (
                listing.isPartner ? (
                  <ReferralListingCard 
                    key={listing.id} 
                    listing={listing as any} 
                    partnerName={listing.partnerName || 'Partner'} 
                  />
                ) : (
                  <ListingCard key={listing.id} listing={listing} />
                )
              ))}
            </div>

            {sortedListings.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No listings found {categorySlug && 'in this category'}
                  </p>
                  {categorySlug && (
                    <button
                      onClick={() => selectCategory(null)}
                      className="mt-4 text-primary hover:underline"
                    >
                      View all categories
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Market Insights & Community Section */}
            <div className="mt-12">
              <MarketInsights />
              <CommentsSection />
            </div>
          </div>
        </div>
      </div>

      {/* Site Assistant Chatbot */}
      <SiteAssistant />
    </div>
  );
};

export default Browse;