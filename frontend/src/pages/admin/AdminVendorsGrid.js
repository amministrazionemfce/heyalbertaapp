import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { BadgeCheck, CheckCircle, Eye, Star, XCircle } from 'lucide-react';
import { getStatusPresentation } from './vendorStatus';
import { getStatusFilterClass } from './vendorStatus';

export function AdminVendorsGrid({
  vendors,
  getCategoryName,
  getTierInfo,
  onView,
  onApprove,
  onReject,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {vendors.map((v) => {
        const tierInfo = getTierInfo(v.tier);
        return (
          <div
            key={v.id}
            className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3 hover:border-slate-300 transition-colors shadow-sm"
            data-testid={`admin-vendor-${v.id}`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <h3 className="font-heading font-semibold text-slate-900 truncate w-full">{v.name}</h3>
                {v.status !== 'approved' ?
                  <Badge className={getStatusFilterClass(v.status, { active: true })}>
                    <span className="p-1 hover:cursor-pointer"> {v.status}</span>
                  </Badge> : 
                  <Badge className="bg-blue-700 hover:bg-blue-700 text-white gap-1">
                    <CheckCircle className="w-4 h-4" /> <span className="p-1 hover:cursor-pointer"> Approved</span>
                  </Badge>
                }
                <Badge variant="secondary" className={tierInfo.color}><span className="p-1 hover:cursor-pointer"> {tierInfo.name}</span></Badge>
                {v.verified && <BadgeCheck className="w-4 h-4 text-spruce-600 flex-shrink-0" />}
                {v.featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-sm text-slate-500 truncate">
                {v.city}
                {getCategoryName(v.category) && ` · ${getCategoryName(v.category)}`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto pt-1">
              <Button size="sm" variant="outline" className="gap-1 flex-1 min-w-0" onClick={() => onView(v)} data-testid={`view-vendor-${v.id}`}>
                <Eye className="w-4 h-4 shrink-0" /> View
              </Button>
              {v.status === 'pending' && (
                <>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0" onClick={() => onApprove(v.id)} data-testid={`approve-${v.id}`}>
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1 shrink-0" onClick={() => onReject(v.id)} data-testid={`reject-${v.id}`}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

