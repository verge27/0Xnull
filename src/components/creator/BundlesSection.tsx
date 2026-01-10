import { Package } from 'lucide-react';
import { ContentBundle, ContentBundleCard } from './ContentBundleCard';
import { CreatorProfile, ContentItem } from '@/services/creatorApi';

interface BundlesSectionProps {
  creator: CreatorProfile;
  content: ContentItem[];
  purchasedBundles?: string[];
}

// Generate mock bundles from content
function generateBundles(content: ContentItem[], creatorName: string): ContentBundle[] {
  const paidContent = content.filter(c => c.tier === 'paid' && c.price_xmr);
  
  if (paidContent.length < 3) return [];

  const bundles: ContentBundle[] = [];

  // Create "Best Of" bundle with first 5 items
  if (paidContent.length >= 3) {
    const items = paidContent.slice(0, Math.min(5, paidContent.length));
    const originalPrice = items.reduce((sum, item) => sum + (item.price_xmr || 0), 0);
    const discountPercent = 25;
    const bundlePrice = +(originalPrice * (1 - discountPercent / 100)).toFixed(3);

    bundles.push({
      id: 'bundle-best-of',
      title: `Best of ${creatorName}`,
      description: `A curated collection of ${creatorName}'s top content`,
      items,
      original_price_xmr: +originalPrice.toFixed(3),
      bundle_price_xmr: bundlePrice,
      discount_percent: discountPercent,
    });
  }

  // Create "Full Collection" bundle if enough content
  if (paidContent.length >= 5) {
    const originalPrice = paidContent.reduce((sum, item) => sum + (item.price_xmr || 0), 0);
    const discountPercent = 40;
    const bundlePrice = +(originalPrice * (1 - discountPercent / 100)).toFixed(3);

    bundles.push({
      id: 'bundle-full',
      title: 'Complete Collection',
      description: `Get everything! All ${paidContent.length} exclusive items at a massive discount`,
      items: paidContent,
      original_price_xmr: +originalPrice.toFixed(3),
      bundle_price_xmr: bundlePrice,
      discount_percent: discountPercent,
    });
  }

  return bundles;
}

export const BundlesSection = ({ creator, content, purchasedBundles = [] }: BundlesSectionProps) => {
  const bundles = generateBundles(content, creator.display_name || 'Creator');

  if (bundles.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-[#FF6600]" />
        <h3 className="text-lg font-semibold">Content Bundles</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Save money by purchasing multiple items together
      </p>
      <div className="grid gap-4">
        {bundles.map((bundle) => (
          <ContentBundleCard
            key={bundle.id}
            bundle={bundle}
            creator={creator}
            isPurchased={purchasedBundles.includes(bundle.id)}
          />
        ))}
      </div>
    </div>
  );
};
