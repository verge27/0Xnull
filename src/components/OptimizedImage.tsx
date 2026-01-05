import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean; // Above the fold - don't lazy load
  sizes?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  objectFit?: 'cover' | 'contain' | 'fill';
  onError?: () => void;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  auto: '',
};

/**
 * Optimized image component with:
 * - Lazy loading for below-fold images
 * - Explicit width/height to prevent CLS
 * - WebP format suggestion via picture element when possible
 * - Proper loading states
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '100vw',
  aspectRatio = 'auto',
  objectFit = 'cover',
  onError,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate WebP source if the original is jpg/png
  const isConvertible = /\.(jpe?g|png)$/i.test(src);
  const webpSrc = isConvertible ? src.replace(/\.(jpe?g|png)$/i, '.webp') : null;

  const handleError = () => {
    setError(true);
    onError?.();
  };

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
  }[objectFit];

  // Common image props
  const imgProps = {
    alt,
    width,
    height,
    loading: priority ? 'eager' as const : 'lazy' as const,
    decoding: priority ? 'sync' as const : 'async' as const,
    onLoad: () => setLoaded(true),
    onError: handleError,
    className: cn(
      'transition-opacity duration-300',
      objectFitClass,
      loaded ? 'opacity-100' : 'opacity-0',
      aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
      className
    ),
    sizes,
  };

  if (error) {
    return (
      <div 
        className={cn(
          'bg-muted flex items-center justify-center text-muted-foreground',
          aspectRatio !== 'auto' && aspectRatioClasses[aspectRatio],
          className
        )}
        style={{ width, height }}
      >
        <span className="text-sm">Image unavailable</span>
      </div>
    );
  }

  // Use picture element for WebP with fallback
  if (webpSrc) {
    return (
      <picture>
        <source srcSet={webpSrc} type="image/webp" />
        <img src={src} {...imgProps} />
      </picture>
    );
  }

  return <img src={src} {...imgProps} />;
}

interface ResponsiveSource {
  src: string;
  width: number;
}

interface BackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  children?: React.ReactNode;
  overlayClassName?: string;
  /** Responsive image sources for srcset - array of {src, width} */
  responsiveSources?: ResponsiveSource[];
  /** Sizes attribute for responsive images */
  sizes?: string;
}

/**
 * Optimized background image component for hero sections
 * Uses img tag instead of CSS background-image for better optimization
 * Supports responsive srcset for serving smaller images on mobile
 */
export function BackgroundImage({
  src,
  alt = '',
  className,
  priority = true, // Hero images are usually above the fold
  children,
  overlayClassName,
  responsiveSources,
  sizes = '100vw',
}: BackgroundImageProps) {
  // Build srcset from responsive sources
  const srcSet = responsiveSources
    ? responsiveSources.map(({ src, width }) => `${src} ${width}w`).join(', ')
    : undefined;

  const imgElement = (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className="w-full h-full object-cover"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  );

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 z-0 overflow-hidden">
        {imgElement}
      </div>
      {overlayClassName && (
        <div className={cn('absolute inset-0', overlayClassName)} />
      )}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
