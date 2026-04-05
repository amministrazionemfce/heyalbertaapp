import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '../constants';

/** Legacy `/vendors` → listings-only browse */
export function RedirectVendorsIndexToListings() {
  return <Navigate to={ROUTES.LISTINGS} replace />;
}

/** Legacy `/vendors/:id` → same listings with vendor filter (deep links keep working) */
export function RedirectVendorDetailToListings() {
  const { id } = useParams();
  const qs = new URLSearchParams();
  if (id) qs.set('userId', String(id));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return <Navigate to={`${ROUTES.LISTINGS}${suffix}`} replace />;
}
