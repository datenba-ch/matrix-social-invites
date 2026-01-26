import React from 'react';
import { cn } from '@/lib/utils';

interface BulletinBoardProps {
  children: React.ReactNode;
  className?: string;
}

export const BulletinBoard: React.FC<BulletinBoardProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn(
      "relative bg-card border-8 border-pixel-brown",
      "p-6 pixel-border-thick",
      "w-full mx-auto flex-1 flex flex-col",
      className
    )}>
      {/* Corner pins */}
      <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-muted border-2 border-border" />
      
      {/* Wood grain texture effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            hsl(var(--pixel-brown)) 20px,
            hsl(var(--pixel-brown)) 21px
          )`
        }}
      />
      
      {children}
    </div>
  );
};

export default BulletinBoard;
