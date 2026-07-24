import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'risk';
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const getColor = () => {
      if (variant === 'risk') {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-yellow-500';
        if (percentage >= 40) return 'bg-orange-500';
        return 'bg-red-500';
      }
      return 'bg-brand-orange';
    };

    return (
      <div ref={ref} className={cn('w-full bg-[#1a1a1a] rounded-full h-2', className)} {...props}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
