import * as React from 'react';

export const Label = React.forwardRef(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 ${className}`.trim()}
    {...props}
  />
));
Label.displayName = 'Label';
