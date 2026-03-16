import * as React from 'react';

const SelectContext = React.createContext({
  value: '',
  onChange: () => {},
  open: false,
  setOpen: () => {},
});

export function Select({ value, onValueChange, defaultValue, children }) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const [open, setOpen] = React.useState(false);
  const isControlled = value !== undefined;
  const val = isControlled ? value : internal;
  const onChange = (v) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
    setOpen(false);
  };
  return (
    <SelectContext.Provider value={{ value: val, onChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', children, ...props }) {
  const { value, open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder = 'Select...', children }) {
  const { value } = React.useContext(SelectContext);
  const display = children != null && children !== '' ? children : (value || placeholder);
  return <span>{display}</span>;
}

export function SelectContent({ className = '', children, ...props }) {
  const { open, setOpen } = React.useContext(SelectContext);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1 max-h-60 min-w-[8rem] overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-md ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, className = '', children, ...props }) {
  const { value: selected, onChange } = React.useContext(SelectContext);
  return (
    <div
      role="option"
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${selected === value ? 'bg-slate-100' : ''} ${className}`.trim()}
      onClick={() => onChange(value)}
      {...props}
    >
      {children}
    </div>
  );
}
