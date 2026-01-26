import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownWheelProps {
  progress: number; // 0-1, where 0 is fresh and 1 is expired
  daysRemaining: number;
  hoursRemaining: number;
  className?: string;
}

export const CountdownWheel: React.FC<CountdownWheelProps> = ({
  progress,
  daysRemaining,
  hoursRemaining,
  className,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Animate progress on mount
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Calculate the stroke dash for the progress ring
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDashoffset = circumference * displayProgress;

  return (
    <div className={cn("relative w-24 h-24", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="square"
          className="transition-all duration-1000 ease-out"
          style={{ imageRendering: 'pixelated' }}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-pixel text-lg text-primary">{daysRemaining}</span>
        <span className="font-pixel text-[8px] text-muted-foreground">
          {daysRemaining === 1 ? 'TAG' : 'TAGE'}
        </span>
        {daysRemaining === 0 && (
          <>
            <span className="font-pixel text-sm text-primary mt-1">{hoursRemaining}h</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CountdownWheel;
