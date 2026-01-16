interface RatingFieldProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  max?: number;
}

export function RatingField({ value, onChange, label, max = 5 }: RatingFieldProps) {
  return (
    <div className="py-3 border-b border-border last:border-0">
      <span className="text-foreground font-medium block mb-3">{label}</span>
      <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`rating-btn font-mono ${
              value === rating
                ? rating <= 2
                  ? 'bg-destructive text-destructive-foreground'
                  : rating === 3
                  ? 'bg-warning text-accent-foreground'
                  : 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}
