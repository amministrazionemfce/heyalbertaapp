import * as React from 'react';

const TabsContext = React.createContext({ value: '', onChange: () => {} });

export function Tabs({ value, defaultValue, onValueChange, children, className = '' }) {
  const [controlled, setControlled] = React.useState(defaultValue ?? '');
  const val = value !== undefined ? value : controlled;
  const onChange = (v) => {
    if (value === undefined) setControlled(v);
    onValueChange?.(v);
  };
  return (
    <TabsContext.Provider value={{ value: val, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children, ...props }) {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = '', children, ...props }) {
  const { value: selected, onChange } = React.useContext(TabsContext);
  const active = selected === value;
  return (
    <button
      type="button"
      role="tab"
      onClick={() => onChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${active ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children, ...props }) {
  const { value: selected } = React.useContext(TabsContext);
  if (selected !== value) return null;
  return (
    <div role="tabpanel" className={`mt-2 ring-offset-white focus-visible:outline-none ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
