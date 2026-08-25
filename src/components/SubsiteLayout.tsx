import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubsiteNavLink {
  label: string;
  to: string;
}

interface SubsiteLayoutProps {
  /** Section name shown on the left, links to the section landing page */
  section: string;
  /** Section landing page path */
  sectionPath: string;
  /** Internal links for this section (may be empty for single-page sections) */
  links?: SubsiteNavLink[];
  children?: React.ReactNode;
  className?: string;
}

/**
 * Shared subsite chrome: a slim, horizontally scrollable section nav bar that
 * sits directly below the global header. Layout only — never alters page content.
 */
export const SubsiteLayout = ({
  section,
  sectionPath,
  links = [],
  children,
  className,
}: SubsiteLayoutProps) => {
  const { pathname } = useLocation();

  return (
    <>
      <nav
        aria-label={`${section} section`}
        className={cn(
          'sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className,
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              to={sectionPath}
              className={cn(
                'text-sm font-semibold tracking-tight transition-colors hover:text-primary',
                pathname === sectionPath ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {section}
            </Link>

            {links.length > 0 && (
              <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
            )}

            <div className="flex items-center gap-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              to="/"
              className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              Hub
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </>
  );
};

export default SubsiteLayout;
