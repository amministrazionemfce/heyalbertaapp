import * as React from 'react';

const DropdownContext = React.createContext({ open: false, setOpen: () => {} });

export function useDropdownMenu() {
  return React.useContext(DropdownContext);
}

export function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children, ...props }) {
  const { setOpen } = React.useContext(DropdownContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, onClick: () => setOpen((v) => !v) });
  }
  return (
    <button type="button" {...props} onClick={() => setOpen((v) => !v)}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = 'start', className = '', children, ...props }) {
  const { open, setOpen } = React.useContext(DropdownContext);
  if (!open) return null;
  const alignClass = align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';
  return (
    <>
      <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
      <div
        className={`absolute z-50 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-0 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/[0.06] backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-200 ${alignClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({ className = '', onClick, variant = 'default', ...props }) {
  const { setOpen } = React.useContext(DropdownContext);
  const variantClass =
    variant === 'destructive'
      ? 'text-slate-700 hover:bg-red-50 hover:text-red-800 focus-visible:bg-red-50'
      : variant === 'highlight'
        ? 'text-spruce-900 bg-spruce-50/90 hover:bg-spruce-100 focus-visible:bg-spruce-100'
        : 'text-slate-700 hover:bg-spruce-50 hover:text-spruce-900 focus-visible:bg-spruce-50';

  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={`group relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors duration-150 ${variantClass} focus-visible:ring-2 focus-visible:ring-spruce-500/35 ${className}`.trim()}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e);
          setOpen(false);
        }
      }}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`my-1.5 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent ${className}`.trim()} />;
}
