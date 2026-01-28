import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownWheelProps {
  progress: number; // 0-1, where 0 is fresh and 1 is expired
  expiresAt: number;
  className?: string;
}

const msPerMinute = 60 * 1000;
const msPerHour = 60 * msPerMinute;
const msPerDay = 24 * msPerHour;

const calculateLiveTime = (expiresAt: number) => {
  const remaining = Math.max(0, expiresAt - Date.now());
  const days = Math.floor(remaining / msPerDay);
  const hours = Math.floor((remaining % msPerDay) / msPerHour);
  const minutes = Math.floor((remaining % msPerHour) / msPerMinute);
  return { days, hours, minutes };
};

export const CountdownWheel: React.FC<CountdownWheelProps> = ({
  progress,
  expiresAt,
  className,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [liveTime, setLiveTime] = useState(() => calculateLiveTime(expiresAt));

  const primaryGreenStyle = { color: '#8da101' };
  const accentGreenStyle = { color: '#8da101' };
  const trackColor = '#8da101';
  const fillColor = '#8da101';

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    const tick = () => {
      setLiveTime(calculateLiveTime(expiresAt));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Generate notched segments (14 segments = 7 days × 2 half-days)
  const totalSegments = 14;
  const radius = 42;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / totalSegments;
  const gapLength = 8; // Smaller gaps for more segments
  const arcLength = segmentLength - gapLength;
  
  // Fill progress for animated ring
  const fillFraction = Math.max(0, Math.min(1, 1 - displayProgress));
  const fillDashOffset = circumference * (1 - fillFraction);

  const formattedTime = useMemo(() => {
    const timeStyle = { color: '#8da101' };

    if (liveTime.days > 0) {
      return (
        <>
          <span className="font-pixel text-lg tracking-[0.35em]" style={primaryGreenStyle}>
            {liveTime.days}
          </span>
          <span className="font-pixel text-[9px] tracking-[0.45em]" style={accentGreenStyle}>
            {liveTime.days === 1 ? 'TAG' : 'TAGE'}
          </span>
          <span
            className="font-pixel text-[10px] mt-0.5 tracking-[0.18em] flex items-center gap-[0.25em]"
            style={{ ...timeStyle, lineHeight: 1 }}
          >
            <span className="tabular-nums">{String(liveTime.hours).padStart(2, '0')}</span>
            <span className="countdown-colon">:</span>
            <span className="tabular-nums">{String(liveTime.minutes).padStart(2, '0')}</span>
          </span>
        </>
      );
    }
    return (
      <>
        <span
          className="font-pixel text-[10px] tracking-[0.2em] flex items-center gap-[0.25em]"
          style={{ ...timeStyle, lineHeight: 1 }}
        >
          <span className="tabular-nums">{String(liveTime.hours).padStart(2, '0')}</span>
          <span className="countdown-colon">:</span>
          <span className="tabular-nums">{String(liveTime.minutes).padStart(2, '0')}</span>
        </span>
        <span className="font-pixel text-[9px]" style={accentGreenStyle}>STUNDEN</span>
      </>
    );
  }, [liveTime]);

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
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={0}
            strokeLinecap="butt"
            transform={`rotate(${rotation} 50 50)`}
          />
          );
        })}
        
        {/* Smooth animated fill ring */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={fillDashOffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      
      {/* Center text - live countdown */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {formattedTime}
      </div>
    </div>
  );
};

export default CountdownWheel;
