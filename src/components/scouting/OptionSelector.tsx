interface SingleSelectProps<T extends string> {
  multiSelect?: false;
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
  label: string;
}

interface MultiSelectProps<T extends string> {
  multiSelect: true;
  value: T[];
  onChange: (value: T[]) => void;
  options: readonly { value: T; label: string }[];
  label: string;
}

type OptionSelectorProps<T extends string> = SingleSelectProps<T> | MultiSelectProps<T>;

export function OptionSelector<T extends string>(props: OptionSelectorProps<T>) {
  const { value, onChange, options, label, multiSelect } = props;

  const handleClick = (optionValue: T) => {
    if (multiSelect) {
      const arr = value as T[];
      const newArr = arr.includes(optionValue)
        ? arr.filter((v) => v !== optionValue)
        : [...arr, optionValue];
      (onChange as (v: T[]) => void)(newArr);
    } else {
      (onChange as (v: T) => void)(optionValue);
    }
  };

  const isSelected = (optionValue: T): boolean => {
    if (multiSelect) {
      return (value as T[]).includes(optionValue);
    }
    return value === optionValue;
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
              isSelected(option.value)
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
