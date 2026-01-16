import { getRatingBgColor } from '@/lib/stats';

interface StatBarProps {
  value: number;
  max: number;
  label: string;
  showValue?: boolean;
  suffix?: string;
}

export function StatBar({ value, max, label, showValue = true, suffix = '' }: StatBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {showValue && (
          <span className="font-mono font-semibold">
            {value}{suffix}
          </span>
        )}
      </div>
      <div className="stat-bar-track">
        <div 
          className={`stat-bar-fill ${getRatingBgColor(value, max)}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
