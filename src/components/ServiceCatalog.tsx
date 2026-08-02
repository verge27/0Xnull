import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  SERVICE_GROUPS,
  servicesInGroup,
  type CatalogService,
  type ServiceGroup,
} from '@/lib/serviceCatalog';

const statusStyles: Record<CatalogService['status'], string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  beta: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  planned: 'bg-muted text-muted-foreground border-border',
};

const ServiceRow = ({ service }: { service: CatalogService }) => {
  const Icon = service.icon;

  const inner = (
    <div className="h-full flex flex-col gap-3 rounded-lg border border-border/60 bg-card/50 p-5 backdrop-blur transition-all hover:border-primary/40 hover:bg-card/80">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold truncate">{service.name}</h4>
            {service.external && <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{service.what}</p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <span className="font-mono text-sm font-semibold">{service.price}</span>
        {service.priceNote && (
          <span className="text-xs text-muted-foreground">{service.priceNote}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={`text-[11px] capitalize ${statusStyles[service.status]}`}>
          {service.status}
        </Badge>
        {service.tokenMetered && (
          <Badge variant="outline" className="text-[11px] font-mono">
            0xn_ token
          </Badge>
        )}
      </div>
    </div>
  );

  if (service.external) {
    return (
      <a href={service.href} target="_blank" rel="noopener noreferrer" className="group">
        {inner}
      </a>
    );
  }
  return (
    <Link to={service.href} className="group">
      {inner}
    </Link>
  );
};

export const ServiceCatalog = ({ groups }: { groups?: ServiceGroup[] }) => {
  const order: ServiceGroup[] = groups ?? ['ai', 'market', 'predictions', 'infra'];

  return (
    <div className="space-y-12">
      {order.map((group) => {
        const services = servicesInGroup(group);
        if (services.length === 0) return null;
        const meta = SERVICE_GROUPS[group];
        return (
          <div key={group}>
            <div className="mb-5">
              <h3 className="text-xl font-bold">{meta.label}</h3>
              <p className="text-sm text-muted-foreground">{meta.blurb}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceRow key={service.name} service={service} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
