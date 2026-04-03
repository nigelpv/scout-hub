import { getRatingBgColor } from '@/lib/stats';
import { cn } from '@/lib/utils';

interface StatBarProps {
  value: number;
  max: number;
  label: string;
  showValue?: boolean;
  suffix?: string;
  className?: string;
}

export function StatBar({ value, max, label, showValue = true, suffix = '', className }: StatBarProps) {
  const percent = Math.min((value / max) * 100, 100);
  
  return (
    <div className="space-y-1 w-full">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showValue && (
            <span className="font-mono font-semibold">
              {value}{suffix}
            </span>
          )}
        </div>
      )}
      <div className="stat-bar-track">
        <div 
          className={cn(
            "stat-bar-fill",
            className || getRatingBgColor(value, max)
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
