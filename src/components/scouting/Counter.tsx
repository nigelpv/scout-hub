import { Minus, Plus } from 'lucide-react';

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

export function Counter({ value, onChange, min = 0, max = 99, label }: CounterProps) {
  const id = `counter-${label.replace(/\s+/g, '-').toLowerCase()}`;

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value);
    if (isNaN(newVal)) {
      // Don't update state to min immediately on every keystroke if empty, 
      // but we need it to be a number. We'll handle empty string by showing 0 or min.
      onChange(min);
      return;
    }
    const clamped = Math.max(min, Math.min(max, newVal));
    onChange(clamped);
  };

  return (
    <div className="field-row">
      <label htmlFor={id} className="text-foreground font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="counter-btn bg-secondary text-secondary-foreground disabled:opacity-30"
          aria-label={`Decrement ${label}`}
        >
          <Minus className="w-6 h-6" />
        </button>
        <input
          id={id}
          type="number"
          value={value}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          onWheel={(e) => (e.target as HTMLInputElement).blur()}
          inputMode="numeric"
          pattern="[0-9]*"
          className="font-mono text-3xl font-bold w-16 h-14 text-center bg-secondary/50 rounded-xl border-0 focus:ring-2 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="counter-btn bg-primary text-primary-foreground disabled:opacity-30 shadow-sm"
          aria-label={`Increment ${label}`}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
