import * as React from 'react';

const DropdownContext = React.createContext({ open: false, setOpen: () => {} });

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
  const alignClass = align === 'end' ? 'right-0' : 'left-0';
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={`absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md ${alignClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function DropdownMenuItem({ className = '', onClick, ...props }) {
  const { setOpen } = React.useContext(DropdownContext);
  return (
    <div
      role="menuitem"
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${className}`.trim()}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`-mx-1 my-1 h-px bg-slate-200 ${className}`.trim()} />;
}
