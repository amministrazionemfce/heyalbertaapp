import { AdminListingCard } from '../../components/AdminListingCard';

function groupListingsByVendor(listings) {
  const map = new Map();
  for (const l of listings) {
    const vid = String(l.vendorId || '');
    if (!map.has(vid)) {
      map.set(vid, {
        vendorId: vid,
        vendorName: l.vendorName || 'Unknown vendor',
        items: [],
      });
    }
    map.get(vid).items.push(l);
  }
  return [...map.values()].sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName, undefined, { sensitivity: 'base' })
  );
}

export function AdminListingsGrid({ listings, onView }) {
  const groups = groupListingsByVendor(listings);

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.vendorId || 'unknown'} className="space-y-3" aria-labelledby={`vendor-row-${group.vendorId}`}>
          <h3
            id={`vendor-row-${group.vendorId}`}
            className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2"
          >
            {group.vendorName}
            <span className="text-slate-400 font-normal ml-2 tabular-nums">({group.items.length})</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:gap-5">
            {group.items.map((l) => (
              <AdminListingCard key={l.id} listing={l} onView={onView} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
