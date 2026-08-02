import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const SITE_URL = 'https://0xnull.io';

export interface Crumb {
  name: string;
  /** Absolute path on the site. Omit on the final crumb (the current page). */
  href?: string;
}

interface SeoBreadcrumbsProps {
  items: Crumb[];
  className?: string;
  /** Unique id so multiple breadcrumb blocks never overwrite each other's JSON-LD. */
  schemaId?: string;
}

/**
 * Visible breadcrumb trail plus a matching BreadcrumbList JSON-LD block.
 * Keeps on-page navigation and structured data in sync so crawlers see the
 * same hierarchy users do.
 */
export function SeoBreadcrumbs({ items, className = '', schemaId = 'breadcrumb-jsonld' }: SeoBreadcrumbsProps) {
  useEffect(() => {
    if (items.length < 2) return;

    document.getElementById(schemaId)?.remove();

    const script = document.createElement('script');
    script.id = schemaId;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: `${SITE_URL}${item.href ?? ''}`,
      })),
    });
    document.head.appendChild(script);

    return () => {
      document.getElementById(schemaId)?.remove();
    };
  }, [JSON.stringify(items), schemaId]);

  if (items.length === 0) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <BreadcrumbItem key={`${item.name}-${index}`}>
              {isLast || !item.href ? (
                <BreadcrumbPage className="line-clamp-1">{item.name}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link to={item.href}>{item.name}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
