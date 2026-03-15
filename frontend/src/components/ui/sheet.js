import * as React from 'react';
import { createPortal } from 'react-dom';

const SheetContext = React.createContext({ open: false, setOpen: () => {} });

export function Sheet({ open: controlledOpen, onOpenChange, defaultOpen, children }) {
  const [open, setOpen] = React.useState(defaultOpen ?? false);
  const isControlled = controlledOpen !== undefined;
  const value = isControlled ? controlledOpen : open;
  const setValue = React.useCallback(
    (v) => {
      if (!isControlled) setOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );
  return (
    <SheetContext.Provider value={{ open: value, setOpen: setValue }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({ asChild, className = '', children, ...props }) {
  const { setOpen } = React.useContext(SheetContext);
  if (asChild && React.isValidElement(children)) {
    const childClassName = [children.props?.className, className].filter(Boolean).join(' ');
    return React.cloneElement(children, { ...props, className: childClassName, onClick: () => setOpen(true) });
  }
  return (
    <button type="button" className={className} {...props} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function SheetContent({ side = 'right', className = '', children, ...props }) {
  const { open, setOpen } = React.useContext(SheetContext);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true));
      });
      return () => cancelAnimationFrame(t);
    } else {
      setMounted(false);
    }
  }, [open]);

  if (!open) return null;

  const sideClass =
    side === 'right'
      ? 'right-0 top-0 h-screen min-h-screen'
      : side === 'left'
      ? 'left-0 top-0 h-screen min-h-screen'
      : side === 'top'
      ? 'top-0 left-0 w-full'
      : 'bottom-0 left-0 w-full';

  const transformClosed =
    side === 'right' ? 'translate-x-full' : side === 'left' ? '-translate-x-full' : side === 'top' ? '-translate-y-full' : 'translate-y-full';
  const transformOpen = 'translate-x-0 translate-y-0';

  const sheetContent = (
    <>
      {/* Backdrop: full viewport, top z-index, close on click outside */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
        onClick={() => setOpen(false)}
      />
      {/* Sheet panel: full height, above backdrop */}
      <div
        className={`fixed z-[9999] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out ${sideClass} ${mounted ? transformOpen : transformClosed} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </>
  );

  return createPortal(sheetContent, document.body);
}
