import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Star } from 'lucide-react';
import { formatListingRegisteredAt } from '../../lib/formatAdminDate';

export function AdminListingDetailDialog({ listing, onClose, getCategoryName, onViewPublic }) {
  const open = !!listing;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="listing-detail-dialog">
        {listing && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2 flex-wrap">
                {listing.title}
                <Badge variant={listing.status === 'published' ? 'default' : 'secondary'} className={listing.status === 'published' ? 'bg-admin-600 border-0' : ''}>
                  {listing.status}
                </Badge>
                {listing.featured && <Star className="w-5 h-5 text-amber-500 fill-amber-500" aria-hidden />}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {listing.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{listing.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Business name</span>
                  <p className="font-medium">
                    {(listing.businessName && String(listing.businessName).trim()) || '—'}
                  </p>
                </div>
                <div><span className="text-slate-500">Category</span><p className="font-medium">{getCategoryName(listing.categoryId) || listing.categoryId || '—'}</p></div>
                <div>
                  <span className="text-slate-500">Registered</span>
                  <p className="font-medium tabular-nums">{formatListingRegisteredAt(listing)}</p>
                </div>
                <div><span className="text-slate-500">Status</span><p className="font-medium">{listing.status || '—'}</p></div>
                <div>
                  <span className="text-slate-500">Featured</span>
                  <p className="font-medium">{listing.featured ? 'Yes' : 'No'}</p>
                  <p className="mt-1 text-xs text-slate-500">Set automatically when the seller has a Standard or Gold membership.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {onViewPublic && listing.status === 'published' && (
                  <Button size="sm" variant="outline" onClick={() => onViewPublic(listing.id)} data-testid={`listing-view-public-${listing.id}`}>
                    View on site
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
