import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type CompanionMood = 'idle' | 'happy' | 'excited' | 'sleeping' | 'waving' | 'thinking' | 'celebrating' | 'curious' | 'surprised';

interface PixelCompanionProps {
  mood?: CompanionMood;
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Pixel art fox rendered with CSS - lightweight, no heavy graphics
const FoxSprite: React.FC<{ mood: CompanionMood; size: 'sm' | 'md' | 'lg' | 'xl' }> = ({ mood, size }) => {
  const [idleFrame, setIdleFrame] = useState(0);
  
  // Idle animation - ear twitch and tail wag
  useEffect(() => {
    if (mood === 'idle') {
      const interval = setInterval(() => {
        setIdleFrame(prev => (prev + 1) % 4);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [mood]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-32 sm:h-32',
    xl: 'w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40',
  };

  const getEarOffset = () => {
    if (mood === 'idle' && idleFrame === 1) return 1;
    if (mood === 'curious') return 2;
    if (mood === 'surprised') return -1;
    return 0;
  };

  const getTailOffset = () => {
    if (mood === 'idle') return idleFrame % 2 === 0 ? 0 : 2;
    if (mood === 'happy' || mood === 'celebrating') return 3;
    if (mood === 'excited') return 4;
    return 0;
  };

  return (
    <div className={cn(
      "relative",
      sizeClasses[size],
      mood === 'idle' && 'animate-blink',
      mood === 'happy' && 'animate-bounce-gentle',
      mood === 'excited' && 'animate-bounce-gentle',
      mood === 'sleeping' && 'opacity-80',
      mood === 'waving' && 'animate-wave',
      mood === 'thinking' && 'animate-float',
      mood === 'celebrating' && 'animate-bounce-gentle',
      mood === 'curious' && 'animate-float',
      mood === 'surprised' && '',
    )}>
      <svg viewBox="0 0 32 32" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
        {/* Ears - with idle animation offset */}
        <rect x="6" y={4 + getEarOffset()} width="4" height="6" fill="hsl(25, 95%, 55%)" />
        <rect x="22" y={4 - getEarOffset()} width="4" height="6" fill="hsl(25, 95%, 55%)" />
        <rect x="7" y={5 + getEarOffset()} width="2" height="3" fill="hsl(25, 80%, 70%)" />
        <rect x="23" y={5 - getEarOffset()} width="2" height="3" fill="hsl(25, 80%, 70%)" />
        
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
        ) : mood === 'celebrating' || mood === 'excited' ? (
          <>
            {/* Happy squint eyes */}
            <rect x="11" y="13" width="3" height="2" fill="hsl(140, 30%, 12%)" />
            <rect x="18" y="13" width="3" height="2" fill="hsl(140, 30%, 12%)" />
            <rect x="11" y="14" width="3" height="1" fill="hsl(45, 80%, 90%)" />
            <rect x="18" y="14" width="3" height="1" fill="hsl(45, 80%, 90%)" />
          </>
        ) : mood === 'surprised' ? (
          <>
            {/* Big surprised eyes */}
            <rect x="10" y="12" width="4" height="4" fill="hsl(140, 30%, 12%)" />
            <rect x="18" y="12" width="4" height="4" fill="hsl(140, 30%, 12%)" />
            <rect x="11" y="12" width="2" height="2" fill="hsl(0, 0%, 100%)" />
            <rect x="19" y="12" width="2" height="2" fill="hsl(0, 0%, 100%)" />
          </>
        ) : mood === 'curious' ? (
          <>
            {/* One eye bigger - curious look */}
            <rect x="11" y="13" width="3" height="3" fill="hsl(140, 30%, 12%)" />
            <rect x="18" y="12" width="4" height="4" fill="hsl(140, 30%, 12%)" />
            <rect x="12" y="13" width="1" height="1" fill="hsl(0, 0%, 100%)" />
            <rect x="19" y="12" width="1" height="1" fill="hsl(0, 0%, 100%)" />
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
        {(mood === 'happy' || mood === 'excited' || mood === 'celebrating') && (
          <>
            <rect x="14" y="19" width="4" height="1" fill="hsl(140, 30%, 12%)" />
            <rect x="13" y="18" width="1" height="1" fill="hsl(140, 30%, 12%)" />
            <rect x="18" y="18" width="1" height="1" fill="hsl(140, 30%, 12%)" />
          </>
        )}
        {mood === 'surprised' && (
          <ellipse cx="16" cy="19" rx="2" ry="1" fill="hsl(140, 30%, 12%)" />
        )}
        
        {/* Body */}
        <rect x="10" y="22" width="12" height="6" fill="hsl(25, 95%, 55%)" />
        <rect x="12" y="22" width="8" height="4" fill="hsl(45, 80%, 90%)" />
        
        {/* Feet */}
        <rect x="10" y="28" width="4" height="2" fill="hsl(25, 80%, 45%)" />
        <rect x="18" y="28" width="4" height="2" fill="hsl(25, 80%, 45%)" />
        
        {/* Tail - with animation offset */}
        <rect x={22 + getTailOffset()} y="24" width="6" height="3" fill="hsl(25, 95%, 55%)" />
        <rect x={26 + getTailOffset()} y="23" width="3" height="2" fill="hsl(45, 80%, 90%)" />
        
        {/* Zzz for sleeping */}
        {mood === 'sleeping' && (
          <>
            <text x="26" y="8" fill="hsl(200, 70%, 50%)" fontSize="4" fontFamily="monospace">z</text>
            <text x="28" y="5" fill="hsl(200, 70%, 50%)" fontSize="3" fontFamily="monospace">z</text>
          </>
        )}

        {/* Sparkles for celebrating */}
        {mood === 'celebrating' && (
          <>
            <rect x="2" y="6" width="2" height="2" fill="hsl(45, 100%, 70%)" />
            <rect x="28" y="4" width="2" height="2" fill="hsl(45, 100%, 70%)" />
            <rect x="4" y="16" width="1" height="1" fill="hsl(45, 100%, 70%)" />
          </>
        )}

        {/* Question mark for curious */}
        {mood === 'curious' && (
          <text x="26" y="8" fill="hsl(200, 70%, 50%)" fontSize="5" fontFamily="monospace">?</text>
        )}

        {/* Exclamation for surprised */}
        {mood === 'surprised' && (
          <text x="26" y="8" fill="hsl(25, 95%, 55%)" fontSize="5" fontFamily="monospace">!</text>
        )}
      </svg>
    </div>
  );
};

const SpeechBubble: React.FC<{ message: string }> = ({ message }) => (
  <div className="relative bg-card border-4 border-border p-4 pixel-shadow w-[75vw] max-w-md">
    <p className="font-pixel text-[10px] leading-relaxed text-card-foreground text-center">
      {message}
    </p>
    {/* Bubble tail */}
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 bg-card border-b-4 border-r-4 border-border transform rotate-45 translate-y-1" />
  </div>
);

export const PixelCompanion: React.FC<PixelCompanionProps> = ({
  mood = 'idle',
  message,
  className,
  size = 'md',
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
      <FoxSprite mood={mood} size={size} />
    </div>
  );
};

export default PixelCompanion;
