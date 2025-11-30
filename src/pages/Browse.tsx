import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ListingCard } from '@/components/ListingCard';
import { getListings } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronRight, ChevronDown } from 'lucide-react';
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
  const listings = getListings();
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());
  
  const categorySlug = searchParams.get('category');
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

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categorySlug || listing.category === categorySlug;
    return matchesSearch && matchesCategory && listing.status === 'active';
  });

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Browse Marketplace</h1>
          <p className="text-muted-foreground mb-4">
            Discover products and services from privacy-focused sellers
          </p>
          
          {/* Breadcrumb Navigation */}
          {categoryPath.length > 0 && (
            <Breadcrumb>
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
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {categoryPath.length > 0 && (
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">
                  {categoryPath[categoryPath.length - 1].name}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'} found
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            {filteredListings.length === 0 && (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
