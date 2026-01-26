import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TearOffCodeProps {
  code: string;
  onClick?: () => void;
  onSwipeLeft?: () => void;
  className?: string;
}

export const TearOffCode: React.FC<TearOffCodeProps> = ({
  code,
  onClick,
  onSwipeLeft,
  className,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.touches[0].clientX;
    const diff = startX.current - currentX;
    // Only allow left swipe
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      // Trigger regenerate
      onSwipeLeft?.();
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsSwiping(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping) return;
    const diff = startX.current - e.clientX;
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 100));
    }
  };

  const handleMouseUp = () => {
    if (swipeOffset > 60) {
      onSwipeLeft?.();
    }
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const handleMouseLeave = () => {
    if (isSwiping) {
      setSwipeOffset(0);
      setIsSwiping(false);
    }
  };

  const swipeProgress = swipeOffset / 60;

  return (
    <div className={cn("relative", className)}>
      {/* Swipe indicator background */}
      <div 
        className="absolute inset-0 flex items-center justify-end pr-4 bg-destructive/20 rounded transition-opacity"
        style={{ opacity: swipeProgress }}
      >
        <span className="font-pixel text-[8px] text-destructive">
          ← REGENERATE
        </span>
      </div>

      {/* Perforated edge */}
      <div className="w-full h-2 tear-off-edge mb-1" />
      
      {/* Code tabs container */}
      <div 
        ref={containerRef}
        className="flex justify-center gap-1 cursor-pointer group select-none"
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {code.split('').map((char, index) => (
          <div
            key={index}
            className={cn(
              "w-10 h-14 bg-pixel-cream flex items-center justify-center",
              "border-2 border-border pixel-shadow",
              "transition-transform duration-150",
              !isSwiping && "group-hover:translate-y-1",
              !isSwiping && "group-active:translate-y-2 group-active:shadow-none"
            )}
            style={{ 
              transitionDelay: isSwiping ? '0ms' : `${index * 30}ms`,
              imageRendering: 'pixelated',
            }}
          >
            <span className="font-pixel text-lg text-pixel-green-dark">
              {char}
            </span>
          </div>
        ))}
      </div>
      
      {/* Hint text */}
      <p className="text-center mt-3 font-pixel text-[8px] text-muted-foreground">
        TAP TO SHOW QR • SWIPE LEFT TO REGENERATE
      </p>
    </div>
  );
};

export default TearOffCode;
