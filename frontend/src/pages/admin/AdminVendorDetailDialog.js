import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Star, CheckCircle2, XCircle } from 'lucide-react';
import { getStatusPresentation } from './vendorStatus';

export function AdminVendorDetailDialog({
  vendor,
  onClose,
  getCategoryName,
  getTierInfo,
  onApprove,
  onReject,
  onToggleFeature,
  actionLoading,
  onViewPublic,
}) {
  const open = !!vendor;
  const status = getStatusPresentation(vendor?.status);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="vendor-detail-dialog">
        {vendor && (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl flex items-center gap-2">
                {vendor.name}
                <Badge className={status.className}>{status.label}</Badge>
                {vendor.featured && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {vendor.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-slate-700">{vendor.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Category</span><p className="font-medium">{getCategoryName(vendor.category) || vendor.category || '—'}</p></div>
                <div><span className="text-slate-500">City</span><p className="font-medium">{vendor.city || '—'}</p></div>
                <div><span className="text-slate-500">Neighborhood</span><p className="font-medium">{vendor.neighborhood || '—'}</p></div>
                <div><span className="text-slate-500">Tier</span><p className="font-medium">{getTierInfo(vendor.tier).name}</p></div>
                <div><span className="text-slate-500">Phone</span><p className="font-medium">{vendor.phone || '—'}</p></div>
                <div><span className="text-slate-500">Email</span><p className="font-medium">{vendor.email || '—'}</p></div>
                <div><span className="text-slate-500">Website</span><p className="font-medium">{vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-spruce-600 hover:underline">{vendor.website}</a> : '—'}</p></div>
                <div><span className="text-slate-500">Reviews</span><p className="font-medium">{vendor.reviewCount ?? 0} (avg {vendor.avgRating ?? 0})</p></div>
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t">
                {vendor.status === 'pending' && (
                  <div>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => onApprove(vendor.id)} disabled={actionLoading} data-testid={`detail-approve-${vendor.id}`}>
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1" onClick={() => onReject(vendor.id)} disabled={actionLoading} data-testid={`detail-reject-${vendor.id}`}>
                      <XCircle className="w-4 h-4" /> Reject
                    </Button>
                  </div>
                )}

                <Button
                  size="sm"
                  variant={vendor.featured ? 'outline' : 'default'}
                  className={vendor.featured ? 'border-amber-300 text-amber-700 hover:bg-amber-50' : 'bg-amber-500 hover:bg-amber-600 text-white'}
                  onClick={() => onToggleFeature(vendor.id, !vendor.featured)}
                  disabled={actionLoading || vendor.status !== 'approved'}
                  title={vendor.status !== 'approved' ? 'Approve vendor first to feature' : undefined}
                  data-testid={`detail-feature-${vendor.id}`}
                >
                  <Star className={`w-4 h-4 shrink-0 mr-1 ${vendor.featured ? 'fill-amber-500' : ''}`} />
                  {vendor.featured ? ' Unfeature this vendor' : ' Feature this vendor'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

