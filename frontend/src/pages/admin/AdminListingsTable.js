import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Eye, Star } from 'lucide-react';
import { formatListingRegisteredAt } from '../../lib/formatAdminDate';

export function AdminListingsTable({ listings, getCategoryName, onView }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-semibold text-slate-700">Title</th>
              <th className="text-left p-4 font-semibold text-slate-700">Business name</th>
              <th className="text-left p-4 font-semibold text-slate-700">Category</th>
              <th className="text-left p-4 font-semibold text-slate-700">Status</th>
              <th className="text-left p-4 font-semibold text-slate-700">Featured</th>
              <th className="text-left p-4 font-semibold text-slate-700 whitespace-nowrap">Registered</th>
              <th className="text-right p-4 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr
                key={l.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                data-testid={`admin-listing-${l.id}`}
              >
                <td className="p-4 font-medium text-slate-900 max-w-[200px] truncate" title={l.title}>{l.title}</td>
                <td className="p-4 text-slate-600">
                  {(l.businessName && String(l.businessName).trim()) || '—'}
                </td>
                <td className="p-4 text-slate-600">{getCategoryName(l.categoryId) || '—'}</td>
                <td className="p-4">
                  <Badge variant={l.status === 'published' ? 'default' : 'secondary'} className={l.status === 'published' ? 'bg-admin-600 border-0' : ''}>
                    {l.status}
                  </Badge>
                </td>
                <td className="p-4">
                  {l.featured ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> : '—'}
                </td>
                <td className="p-4 text-slate-600 whitespace-nowrap tabular-nums">
                  {formatListingRegisteredAt(l)}
                </td>
                <td className="p-4 text-right flex items-center justify-end gap-1">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => onView(l)} data-testid={`view-listing-${l.id}`}>
                    <Eye className="w-4 h-4" /> View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
