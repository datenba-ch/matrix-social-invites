import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type CompanionMood = 'idle' | 'happy' | 'excited' | 'sleeping' | 'waving' | 'thinking';

interface PixelCompanionProps {
  mood?: CompanionMood;
  message?: string;
  className?: string;
}

// Pixel art fox rendered with CSS - lightweight, no heavy graphics
const FoxSprite: React.FC<{ mood: CompanionMood }> = ({ mood }) => {
  const baseClasses = "relative w-16 h-16";
  
  return (
    <div className={cn(
      baseClasses,
      mood === 'idle' && 'animate-blink',
      mood === 'happy' && 'animate-bounce-gentle',
      mood === 'excited' && 'animate-bounce-gentle',
      mood === 'sleeping' && 'opacity-80',
      mood === 'waving' && 'animate-wave',
      mood === 'thinking' && 'animate-float',
    )}>
      {/* Fox body - pixel art style using divs */}
      <svg viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        {/* Ears */}
        <rect x="6" y="4" width="4" height="6" fill="hsl(25, 95%, 55%)" />
        <rect x="22" y="4" width="4" height="6" fill="hsl(25, 95%, 55%)" />
        <rect x="7" y="5" width="2" height="3" fill="hsl(25, 80%, 70%)" />
        <rect x="23" y="5" width="2" height="3" fill="hsl(25, 80%, 70%)" />
        
        {/* Head */}
        <rect x="8" y="8" width="16" height="12" fill="hsl(25, 95%, 55%)" />
        <rect x="6" y="10" width="2" height="8" fill="hsl(25, 95%, 55%)" />
        <rect x="24" y="10" width="2" height="8" fill="hsl(25, 95%, 55%)" />
        
        {/* Face - white area */}
        <rect x="10" y="12" width="12" height="8" fill="hsl(45, 80%, 90%)" />
        <rect x="12" y="20" width="8" height="2" fill="hsl(45, 80%, 90%)" />
        
        {/* Eyes */}
        {mood === 'sleeping' ? (
          <>
            <rect x="11" y="14" width="3" height="1" fill="hsl(140, 30%, 12%)" />
            <rect x="18" y="14" width="3" height="1" fill="hsl(140, 30%, 12%)" />
          </>
        ) : (
          <>
            <rect x="11" y="13" width="3" height="3" fill="hsl(140, 30%, 12%)" />
            <rect x="18" y="13" width="3" height="3" fill="hsl(140, 30%, 12%)" />
            {/* Eye shine */}
            <rect x="12" y="13" width="1" height="1" fill="hsl(0, 0%, 100%)" />
            <rect x="19" y="13" width="1" height="1" fill="hsl(0, 0%, 100%)" />
          </>
        )}
        
        {/* Nose */}
        <rect x="15" y="17" width="2" height="2" fill="hsl(140, 30%, 12%)" />
        
        {/* Mouth - changes based on mood */}
        {(mood === 'happy' || mood === 'excited') && (
          <rect x="14" y="19" width="4" height="1" fill="hsl(140, 30%, 12%)" />
        )}
        
        {/* Body */}
        <rect x="10" y="22" width="12" height="6" fill="hsl(25, 95%, 55%)" />
        <rect x="12" y="22" width="8" height="4" fill="hsl(45, 80%, 90%)" />
        
        {/* Feet */}
        <rect x="10" y="28" width="4" height="2" fill="hsl(25, 80%, 45%)" />
        <rect x="18" y="28" width="4" height="2" fill="hsl(25, 80%, 45%)" />
        
        {/* Tail */}
        <rect x="22" y="24" width="6" height="3" fill="hsl(25, 95%, 55%)" />
        <rect x="26" y="23" width="3" height="2" fill="hsl(45, 80%, 90%)" />
        
        {/* Zzz for sleeping */}
        {mood === 'sleeping' && (
          <>
            <text x="26" y="8" fill="hsl(200, 70%, 50%)" fontSize="4" fontFamily="monospace">z</text>
            <text x="28" y="5" fill="hsl(200, 70%, 50%)" fontSize="3" fontFamily="monospace">z</text>
          </>
        )}
      </svg>
    </div>
  );
};

const SpeechBubble: React.FC<{ message: string }> = ({ message }) => (
  <div className="relative bg-card border-4 border-border p-3 pixel-shadow max-w-48">
    <p className="font-pixel text-[8px] leading-relaxed text-card-foreground">
      {message}
    </p>
    {/* Bubble tail */}
    <div className="absolute -bottom-2 left-4 w-4 h-4 bg-card border-b-4 border-r-4 border-border transform rotate-45 translate-y-1" />
  </div>
);

export const PixelCompanion: React.FC<PixelCompanionProps> = ({
  mood = 'idle',
  message,
  className,
}) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (message) {
      setShowMessage(true);
    }
  }, [message]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {message && showMessage && (
        <div className="animate-fade-in">
          <SpeechBubble message={message} />
        </div>
      )}
      <FoxSprite mood={mood} />
    </div>
  );
};

export default PixelCompanion;
