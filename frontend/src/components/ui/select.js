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
  const containerRef = React.useRef(null);

  const isControlled = value !== undefined;
  const val = isControlled ? value : internal;
  const onChange = React.useCallback(
    (v) => {
      if (!isControlled) setInternal(v);
      onValueChange?.(v);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  /** Close when clicking outside the whole control (trigger + menu). Ref must include trigger — not only the menu — or the trigger click is treated as “outside” and fights toggle. */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <SelectContext.Provider value={{ value: val, onChange, open, setOpen }}>
      <div className="relative" ref={containerRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', children, ...props }) {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
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
  return <span className="truncate text-left">{display}</span>;
}

export function SelectContent({ className = '', children, ...props }) {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <div
      role="listbox"
      className={`absolute left-0 right-0 top-full z-[100] mt-1 max-h-60 w-full min-w-0 overflow-y-auto overflow-x-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg ${className}`.trim()}
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
      aria-selected={selected === value}
      className={`relative flex w-full min-w-0 cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 ${selected === value ? 'bg-slate-100' : ''} ${className}`.trim()}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(value);
      }}
      {...props}
    >
      {children}
    </div>
  );
}
