/**
 * Same logo + spruce ring as BrandLoadingOverlay, for inline use (e.g. directory).
 */
const SIZES = {
  sm: { box: 'h-16 w-16', img: 'h-10', radius: 'rounded-2xl' },
  md: { box: 'h-24 w-24', img: 'h-14', radius: 'rounded-3xl' },
  lg: { box: 'h-28 w-28', img: 'h-16', radius: 'rounded-3xl' },
};

export default function BrandSpinner({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <div className={`relative flex ${s.box} shrink-0 items-center justify-center ${className}`}>
      <span
        className={`absolute inset-0 ${s.radius} border-2 border-spruce-800 animate-spin`}
        style={{ animationDuration: '1.1s' }}
        aria-hidden
      />
      <img
        src={`${process.env.PUBLIC_URL}/logo.png`}
        alt=""
        className={`relative z-10 ${s.img} w-auto object-contain drop-shadow-lg`}
        aria-hidden
      />
    </div>
  );
}
