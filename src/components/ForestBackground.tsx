import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import forestWallpaper from '@/assets/forest-wallpaper.png';

interface ForestBackgroundProps {
  className?: string;
  showFireflies?: boolean;
}

interface Firefly {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
}

const Firefly: React.FC<{ firefly: Firefly }> = ({ firefly }) => (
  <div
    className="absolute rounded-full animate-firefly"
    style={{
      left: `${firefly.x}%`,
      top: `${firefly.y}%`,
      width: firefly.size,
      height: firefly.size,
      backgroundColor: 'hsl(60, 100%, 70%)',
      boxShadow: `0 0 ${firefly.size * 2}px ${firefly.size}px hsl(60, 100%, 70%, 0.5)`,
      animationDelay: `${firefly.delay}s`,
      animationDuration: `${firefly.duration}s`,
    }}
  />
);

export const ForestBackground: React.FC<ForestBackgroundProps> = ({
  className,
  showFireflies = true,
}) => {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);

  // Generate random fireflies on mount
  useEffect(() => {
    if (showFireflies) {
      const newFireflies: Firefly[] = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 20 + Math.random() * 60,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 2 + Math.random() * 3,
      }));
      setFireflies(newFireflies);
    }
  }, [showFireflies]);

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Full-screen pixel art wallpaper */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${forestWallpaper})`,
          imageRendering: 'pixelated',
        }}
      />
      
      {/* Dark overlay for better UI contrast */}
      <div className="absolute inset-0 bg-background/40" />

      {/* Fireflies layer */}
      {showFireflies && (
        <div className="absolute inset-0">
          {fireflies.map(firefly => (
            <Firefly key={firefly.id} firefly={firefly} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ForestBackground;