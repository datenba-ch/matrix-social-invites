import React from 'react';
import { cn } from '@/lib/utils';

interface TearOffCodeProps {
  code: string;
  onClick?: () => void;
  className?: string;
}

export const TearOffCode: React.FC<TearOffCodeProps> = ({
  code,
  onClick,
  className,
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Perforated edge */}
      <div className="w-full h-2 tear-off-edge mb-1" />
      
      {/* Code tabs container */}
      <div 
        className="flex justify-center gap-1 cursor-pointer group"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        {code.split('').map((char, index) => (
          <div
            key={index}
            className={cn(
              "w-10 h-14 bg-pixel-cream flex items-center justify-center",
              "border-2 border-border pixel-shadow",
              "transition-transform duration-150",
              "group-hover:translate-y-1",
              "group-active:translate-y-2 group-active:shadow-none"
            )}
            style={{ 
              transitionDelay: `${index * 30}ms`,
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
        TAP TO SHOW QR
      </p>
    </div>
  );
};

export default TearOffCode;
