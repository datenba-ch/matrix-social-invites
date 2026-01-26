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
  const segmentAngle = 360 / totalSegments;
  const gapAngle = 8; // Gap between segments in degrees
  const segmentArcAngle = segmentAngle - gapAngle;
  
  // Calculate how many segments should be filled
  const filledSegments = Math.ceil((1 - displayProgress) * totalSegments);

  const createSegmentPath = (index: number) => {
    const startAngle = index * segmentAngle - 90; // Start from top
    const endAngle = startAngle + segmentArcAngle;
    const radius = 42;
    const centerX = 50;
    const centerY = 50;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = segmentArcAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <div className={cn("relative w-28 h-28", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background segments */}
        {Array.from({ length: totalSegments }).map((_, index) => (
          <path
            key={`bg-${index}`}
            d={createSegmentPath(index)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
            strokeLinecap="square"
            style={{ imageRendering: 'pixelated' }}
          />
        ))}
        
        {/* Filled segments */}
        {Array.from({ length: totalSegments }).map((_, index) => (
          <path
            key={`fill-${index}`}
            d={createSegmentPath(index)}
            fill="none"
            stroke={index < filledSegments ? "hsl(var(--primary))" : "transparent"}
            strokeWidth="10"
            strokeLinecap="square"
            className="transition-all duration-500 ease-out"
            style={{ imageRendering: 'pixelated' }}
          />
        ))}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-pixel text-xl text-primary">{daysRemaining}</span>
        <span className="font-pixel text-[8px] text-muted-foreground">
          {daysRemaining === 1 ? 'TAG' : 'TAGE'}
        </span>
        {daysRemaining === 0 && (
          <span className="font-pixel text-sm text-primary mt-1">{hoursRemaining}h</span>
        )}
      </div>
    </div>
  );
};

export default CountdownWheel;
