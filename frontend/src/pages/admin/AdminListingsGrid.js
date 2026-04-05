import ListingCard from '../../components/ListingCard';

/**
 * Same card layout as the public listings directory; click opens admin detail dialog.
 */
export function AdminListingsGrid({ listings, onView }) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 md:gap-6 lg:gap-7"
      data-testid="admin-listings-grid"
    >
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} onAdminOpen={onView} />
      ))}
    </div>
  );
}
