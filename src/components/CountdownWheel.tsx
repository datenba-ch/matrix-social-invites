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

  // Generate notched segments (7 days = 7 segments)
  const totalSegments = 7;
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / totalSegments;
  const gapLength = 12; // Gap between segments in pixels
  const arcLength = segmentLength - gapLength;
  
  // Calculate how many segments should be filled (counting from segment 0)
  const filledSegments = Math.ceil((1 - displayProgress) * totalSegments);

  return (
    <div className={cn("relative w-[70%] aspect-square mx-auto", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background track - all segments as muted */}
        {Array.from({ length: totalSegments }).map((_, index) => {
          const rotation = (index * 360) / totalSegments - 90;
          return (
            <circle
              key={`bg-${index}`}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
              transform={`rotate(${rotation} 50 50)`}
            />
          );
        })}
        
        {/* Filled segments with depletion animation */}
        {Array.from({ length: totalSegments }).map((_, index) => {
          const isFilled = index < filledSegments;
          const rotation = (index * 360) / totalSegments - 90;
          return (
            <circle
              key={`fill-${index}`}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference - arcLength}`}
              strokeDashoffset={0}
              strokeLinecap="butt"
              transform={`rotate(${rotation} 50 50)`}
              style={{ 
                opacity: isFilled ? 1 : 0,
                transition: 'opacity 0.5s ease-out',
              }}
            />
          );
        })}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-pixel text-2xl text-primary">{daysRemaining}</span>
        <span className="font-pixel text-[10px] text-muted-foreground">
          {daysRemaining === 1 ? 'TAG' : 'TAGE'}
        </span>
        {daysRemaining === 0 && (
          <span className="font-pixel text-base text-primary mt-1">{hoursRemaining}h</span>
        )}
      </div>
    </div>
  );
};

export default CountdownWheel;
