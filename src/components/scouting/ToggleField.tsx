import { Check, X } from 'lucide-react';

interface ToggleFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

export function ToggleField({ value, onChange, label }: ToggleFieldProps) {
  return (
    <div className="field-row">
      <span className="text-foreground font-medium">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`counter-btn ${
            !value 
              ? 'bg-destructive text-destructive-foreground' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`counter-btn ${
            value 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
