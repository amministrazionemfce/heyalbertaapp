import * as React from 'react';

export const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    className={`flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
