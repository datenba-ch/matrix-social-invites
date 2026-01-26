import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownWheelProps {
  progress: number; // 0-1, where 0 is fresh and 1 is expired
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining?: number;
  className?: string;
}

export const CountdownWheel: React.FC<CountdownWheelProps> = ({
  progress,
  daysRemaining,
  hoursRemaining,
  minutesRemaining = 0,
  className,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [liveTime, setLiveTime] = useState({ days: daysRemaining, hours: hoursRemaining, minutes: minutesRemaining });

  useEffect(() => {
    // Animate progress on mount
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Live countdown timer
  useEffect(() => {
    setLiveTime({ days: daysRemaining, hours: hoursRemaining, minutes: minutesRemaining });
    
    const interval = setInterval(() => {
      setLiveTime(prev => {
        let { days, hours, minutes } = prev;
        
        if (minutes > 0) {
          minutes--;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
        }
        
        return { days, hours, minutes };
      });
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [daysRemaining, hoursRemaining, minutesRemaining]);

  // Generate notched segments (14 segments = 7 days × 2 half-days)
  const totalSegments = 14;
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / totalSegments;
  const gapLength = 8; // Smaller gaps for more segments
  const arcLength = segmentLength - gapLength;
  
  // Calculate how many segments should be filled (counting from segment 0)
  const filledSegments = Math.ceil((1 - displayProgress) * totalSegments);

  // Format time display
  const formatTime = () => {
    if (liveTime.days > 0) {
      return (
        <>
          <span className="font-pixel text-2xl text-primary">{liveTime.days}</span>
          <span className="font-pixel text-[10px] text-muted-foreground">
            {liveTime.days === 1 ? 'TAG' : 'TAGE'}
          </span>
          <span className="font-pixel text-xs text-primary/70 mt-0.5">
            {String(liveTime.hours).padStart(2, '0')}:{String(liveTime.minutes).padStart(2, '0')}
          </span>
        </>
      );
    }
    return (
      <>
        <span className="font-pixel text-xl text-primary">
          {String(liveTime.hours).padStart(2, '0')}:{String(liveTime.minutes).padStart(2, '0')}
        </span>
        <span className="font-pixel text-[10px] text-muted-foreground">STUNDEN</span>
      </>
    );
  };

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
              stroke="hsl(var(--primary) / 0.2)"
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
      
      {/* Center text - live countdown */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {formatTime()}
      </div>
    </div>
  );
};

export default CountdownWheel;
