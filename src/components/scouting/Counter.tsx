import { Minus, Plus } from 'lucide-react';

interface CounterProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

export function Counter({ value, onChange, min = 0, max = 99, label }: CounterProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="field-row">
      <span className="text-foreground font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="counter-btn bg-secondary text-secondary-foreground disabled:opacity-30"
        >
          <Minus className="w-6 h-6" />
        </button>
        <span className="font-mono text-3xl font-bold w-12 text-center">{value}</span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className="counter-btn bg-primary text-primary-foreground disabled:opacity-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
