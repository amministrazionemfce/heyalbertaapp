import * as React from 'react';

const variants = {
  default: 'bg-spruce-700 text-white hover:bg-spruce-800',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-slate-200 bg-white hover:bg-slate-50',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  ghost: 'hover:bg-slate-100',
  link: 'text-slate-900 underline-offset-4 hover:underline',
};
const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

export const Button = React.forwardRef(
  ({ className = '', variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    const cn = `inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`.trim();
    return <Comp ref={ref} className={cn} {...props} />;
  }
);
Button.displayName = 'Button';
