import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

/**
 * Reusable modal prompting the user to upgrade to a vendor account.
 * Use with useAddListingClick() for open/close and confirm logic.
 */
export default function UpgradeToVendorModal({ open, onOpenChange, onConfirm, loading }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Vendor</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          You need to upgrade to a vendor account to add listings. Do you want to upgrade to a vendor account?
        </p>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            No
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upgrading…
              </>
            ) : (
              'Yes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
