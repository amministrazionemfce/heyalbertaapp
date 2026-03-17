import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

const DASHBOARD_ADD_LISTING = '/dashboard?tab=add-listing';

/**
 * Reusable hook for "Add Listings" / "List your business" actions.
 * - Not logged in → navigate to /register
 * - Vendor/Admin → navigate to dashboard add-listing tab
 * - User → open upgrade modal; on confirm, upgrade role and navigate to add-listing
 *
 * @returns { handleAddListingClick, upgradeModalProps }
 * Use upgradeModalProps with <UpgradeToVendorModal {...upgradeModalProps} />
 */
export function useAddListingClick() {
  const { user, upgradeToVendor } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddListingClick = useCallback(() => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.role === 'vendor' || user.role === 'admin') {
      navigate(DASHBOARD_ADD_LISTING);
      return;
    }
    setOpen(true);
  }, [user, navigate]);

  const handleUpgradeConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await upgradeToVendor();
      toast.success('Account upgraded to Vendor. You can now add listings.');
      setOpen(false);
      navigate(DASHBOARD_ADD_LISTING);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  }, [upgradeToVendor, navigate]);

  const upgradeModalProps = {
    open,
    onOpenChange: setOpen,
    onConfirm: handleUpgradeConfirm,
    loading,
  };

  return { handleAddListingClick, upgradeModalProps };
}
