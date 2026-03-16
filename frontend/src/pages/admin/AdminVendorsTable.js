import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Eye } from 'lucide-react';
import { getStatusFilterClass } from './vendorStatus';
import { CheckCircle } from 'lucide-react';

export function AdminVendorsTable({ vendors, getCategoryName, getTierInfo, onView }) {
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
                      <Badge className={getStatusFilterClass(v.status, { active: true })}>
                        <span className="p-1 hover:cursor-pointer"> {v.status}</span>
                      </Badge> :
                      <Badge className="bg-blue-700 hover:bg-blue-700 text-white gap-1">
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
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => onView(v)} data-testid={`view-vendor-${v.id}`}>
                      <Eye className="w-4 h-4" /> View
                    </Button>
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

