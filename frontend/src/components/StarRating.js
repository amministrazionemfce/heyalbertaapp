import { Star } from 'lucide-react';

export function StarRating({ rating, size = 16, showCount, count }) {
  return (
    <div className="flex items-center gap-1" data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating)
            ? "fill-secondary-500 text-secondary-500"
            : "fill-slate-200 text-slate-200"
          }
        />
      ))}
      {showCount && (
        <span className="text-sm text-muted-foreground ml-1">
          {rating > 0 ? rating.toFixed(1) : "No ratings"} {count !== undefined && `(${count})`}
        </span>
      )}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1" data-testid="star-input">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
          data-testid={`star-input-${star}`}
        >
          <Star
            size={24}
            className={star <= value
              ? "fill-secondary-500 text-secondary-500"
              : "fill-slate-200 text-slate-300 hover:fill-secondary-200 hover:text-secondary-300"
            }
          />
        </button>
      ))}
    </div>
  );
}