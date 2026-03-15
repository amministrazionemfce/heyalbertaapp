import * as React from 'react';

const DialogContext = React.createContext({ open: false, setOpen: () => {} });

export function Dialog({ open: controlledOpen, onOpenChange, defaultOpen, children }) {
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
    <DialogContext.Provider value={{ open: value, setOpen: setValue }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ asChild, children, ...props }) {
  const { setOpen } = React.useContext(DialogContext);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...props, onClick: () => setOpen(true) });
  }
  return (
    <button type="button" {...props} onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

export function DialogContent({ className = '', children, onCloseAutoFocus, ...props }) {
  const { open, setOpen } = React.useContext(DialogContext);
  if (!open) return null;
  return (
    <>
      <div 
       className="fixed inset-0 z-50 bg-black/50"
       style={{ margin: '0px' }}
       aria-hidden 
       onClick={() => setOpen(false)} />
      <div
        role="dialog"
        className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-lg rounded-lg ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export function DialogHeader({ className = '', ...props }) {
  return <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`.trim()} {...props} />;
}

export function DialogTitle({ className = '', ...props }) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`.trim()} {...props} />;
}
