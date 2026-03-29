import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { getVendorStatusBadgeClass } from './vendorStatus';
import { CheckCircle } from 'lucide-react';

export function AdminVendorsTable({ vendors, getCategoryName, getTierInfo, onSeeDetails }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Name</th>
              <th className="text-left p-4 font-semibold text-slate-700">City</th>
              <th className="text-left p-4 font-semibold text-slate-700">Category</th>
              <th className="text-left p-4 font-semibold text-slate-700">Status</th>
              <th className="text-left p-4 font-semibold text-slate-700">Tier</th>
              <th className="text-left p-4 font-semibold text-slate-700">Reviews</th>
              <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              const tierInfo = getTierInfo(v.tier);
              const categoryName = getCategoryName(v.category);
              return (
                <tr
                  key={v.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                  data-testid={`admin-vendor-${v.id}`}
                >
                  <td className="p-4 font-medium text-slate-900">{v.name}</td>
                  <td className="p-4 text-slate-600">{v.city || '—'}</td>
                  <td className="p-4 text-slate-600">{categoryName || '—'}</td>
                  <td className="p-4">
                    {v.status !== 'approved' ?
                      <Badge className={getVendorStatusBadgeClass(v.status)}>
                        <span className="p-1 hover:cursor-pointer capitalize"> {v.status}</span>
                      </Badge> :
                      <Badge className={`${getVendorStatusBadgeClass('approved')} gap-1 border-0`}>
                        <CheckCircle className="w-4 h-4" /> <span className="p-1 hover:cursor-pointer"> Approved</span>
                      </Badge>
                    }
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className={tierInfo.color}>
                      {tierInfo.name}
                    </Badge>
                  </td>
                  <td className="p-4 text-slate-600">
                    {v.reviewCount ?? 0} ({v.avgRating ?? 0})
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => onSeeDetails(v)} data-testid={`see-details-vendor-${v.id}`}>
                        <Eye className="w-4 h-4" /> See Details
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
