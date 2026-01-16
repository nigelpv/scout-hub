interface OptionSelectorProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
}

export function OptionSelector<T extends string>({ 
  value, 
  onChange, 
  options, 
  label 
}: OptionSelectorProps<T>) {
  const handleClick = (optionValue: T) => {
    onChange(optionValue);
  };

  return (
    <div className="py-3 border-b border-border last:border-0">
      <span className="text-foreground font-medium block mb-3">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            className={`px-4 py-3 rounded-lg font-medium text-sm transition-all ${
              value === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
