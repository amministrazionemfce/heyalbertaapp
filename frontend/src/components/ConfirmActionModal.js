import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

const VARIANTS = {
  danger: {
    headerClass:
      'bg-spruce-800 text-white',
    iconWrap: 'bg-white/20 text-white ring-white/30',
    confirmClass:
      'bg-red-600 hover:from-adminDanger-700 hover:via-red-700 hover:to-adminDanger-900 text-white shadow-md shadow-adminDanger-900/25',
    
  },
  warning: {
    headerClass:
      'bg-spruce-800 text-white',
    iconWrap: 'bg-white/20 text-white ring-white/30',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md',
  },
  neutral: {
    headerClass: 'bg-spruce-800 text-white',
    iconWrap: 'bg-white/15 text-white ring-white/20',
    confirmClass: 'bg-spruce-800 hover:bg-slate-900 text-white',
  },
};

/**
 * Reusable confirmation dialog with optional checkbox (e.g. “notify by email”).
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {'danger'|'warning'|'neutral'} [props.variant='danger']
 * @param {string} props.title
 * @param {React.ReactNode} props.description
 * @param {import('lucide-react').LucideIcon} [props.icon]
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {() => void | Promise<void>} props.onConfirm
 * @param {boolean} [props.loading]
 * @param {{ id: string, label: string, description?: string, checked: boolean, onChange: (v: boolean) => void }} [props.checkbox]
 * @param {React.ReactNode} [props.children] — extra body content below description
 * @param {string} [props.footerNote] — small muted text under actions
 */
export default function ConfirmActionModal({
  open,
  onOpenChange,
  variant = 'danger',
  title,
  description,
  icon: Icon = Trash2,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  checkbox,
  children,
  footerNote,
  'data-testid': dataTestId = 'confirm-action-modal',
}) {
  const v = VARIANTS[variant] || VARIANTS.danger;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch {
      /* parent handles errors */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-[min(100%,30rem)] gap-0 overflow-hidden border-0 p-0 ${v.ring}`}
        data-testid={dataTestId}
      >
        <div className={`relative px-6 pb-5 pt-8 ${v.headerClass}`}>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.15) 0%, transparent 40%)',
            }}  
            aria-hidden
          />
          <div className="relative flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${v.iconWrap}`}
            >
              <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
            </div>
            <DialogHeader className="space-y-2 text-center sm:text-center">
              <DialogTitle className="font-heading text-xl font-bold tracking-tight text-white">
                {title}
              </DialogTitle>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-4px-6 py-5">
          <div className="text-center text-sm leading-relaxed text-slate-600 sm:text-left">
            {description}
          </div>

          {children}

          {checkbox && (
            <label
              htmlFor={checkbox.id}
              className="flex cursor-pointer gap-3 rounded-xl bg-slate-50/80 p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/40"
            >
              <input
                id={checkbox.id}
                type="checkbox"
                checked={checkbox.checked}
                onChange={(e) => checkbox.onChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                data-testid={checkbox.testId}
              />
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold text-slate-900">{checkbox.label}</span>
                {checkbox.description && (
                  <span className="mt-1 block text-xs text-slate-500 leading-relaxed">
                    {checkbox.description}
                  </span>
                )}
              </span>
            </label>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full border-slate-200 sm:w-auto"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              data-testid="confirm-modal-cancel"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              className={`w-full sm:w-auto ${v.confirmClass}`}
              onClick={handleConfirm}
              disabled={loading}
              data-testid="confirm-modal-confirm"
            >
              {loading ? 'Please wait…' : confirmLabel}
            </Button>
          </div>

          {footerNote && (
            <p className="flex items-start justify-center gap-1.5 text-center text-xs text-slate-400 sm:text-left">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
              {footerNote}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
