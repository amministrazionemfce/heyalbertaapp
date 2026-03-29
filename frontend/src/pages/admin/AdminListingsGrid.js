import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Calendar, Eye, Star } from 'lucide-react';
import { formatListingRegisteredAt } from '../../lib/formatAdminDate';

export function AdminListingsGrid({ listings, getCategoryName, onView }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
      {listings.map((l) => (
        <div
          key={l.id}
          className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:border-slate-300 transition-colors shadow-sm"
          data-testid={`admin-listing-${l.id}`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <h3 className="font-heading font-semibold text-slate-900 line-clamp-2 w-full">{l.title}</h3>
              <Badge variant={l.status === 'published' ? 'default' : 'secondary'} className={l.status === 'published' ? 'bg-admin-600 text-xs border-0' : 'text-xs'}>
                {l.status}
              </Badge>
              {l.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-slate-500 truncate">{l.vendorName || '—'}</p>
            {getCategoryName(l.categoryId) && (
              <p className="text-xs text-slate-400 mt-0.5">{getCategoryName(l.categoryId)}</p>
            )}
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 tabular-nums">
              <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden />
              Registered {formatListingRegisteredAt(l)}
            </p>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2 flex-1">{l.description}</p>
          <div className="flex flex-wrap gap-2 mt-auto pt-1">
            <Button size="sm" variant="outline" className="gap-1 flex-1 min-w-0" onClick={() => onView(l)} data-testid={`view-listing-${l.id}`}>
              <Eye className="w-4 h-4 shrink-0" /> View
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
