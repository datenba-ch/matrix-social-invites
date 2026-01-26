import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ForestBackgroundProps {
  className?: string;
  showFireflies?: boolean;
  showTrees?: boolean;
}

interface Firefly {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
}

interface Tree {
  id: number;
  x: number;
  height: number;
  width: number;
  delay: number;
}

const PixelTree: React.FC<{ tree: Tree }> = ({ tree }) => (
  <div
    className="absolute bottom-0"
    style={{
      left: `${tree.x}%`,
      animationDelay: `${tree.delay}s`,
    }}
  >
    <svg
      width={tree.width}
      height={tree.height}
      viewBox="0 0 24 40"
      style={{ imageRendering: 'pixelated' }}
      className="animate-sway"
    >
      {/* Tree trunk */}
      <rect x="10" y="28" width="4" height="12" fill="hsl(25, 40%, 25%)" />
      
      {/* Tree foliage layers */}
      <polygon points="12,0 4,14 20,14" fill="hsl(140, 40%, 25%)" />
      <polygon points="12,8 2,22 22,22" fill="hsl(140, 35%, 30%)" />
      <polygon points="12,16 0,30 24,30" fill="hsl(140, 30%, 35%)" />
      
      {/* Highlight */}
      <polygon points="12,0 8,8 12,6" fill="hsl(140, 45%, 35%)" opacity="0.5" />
    </svg>
  </div>
);

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
  showTrees = true,
}) => {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [trees, setTrees] = useState<Tree[]>([]);

  // Generate random fireflies and trees on mount
  useEffect(() => {
    if (showFireflies) {
      const newFireflies: Firefly[] = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 20 + Math.random() * 60,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 2 + Math.random() * 3,
      }));
      setFireflies(newFireflies);
    }

    if (showTrees) {
      const newTrees: Tree[] = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: i * 14 + Math.random() * 8,
        height: 60 + Math.random() * 40,
        width: 30 + Math.random() * 20,
        delay: Math.random() * 2,
      }));
      setTrees(newTrees);
    }
  }, [showFireflies, showTrees]);

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, hsl(var(--pixel-green-light)) 0%, transparent 30%),
            radial-gradient(circle at 80% 20%, hsl(var(--pixel-green-light)) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, hsl(var(--pixel-green-light)) 0%, transparent 40%)
          `
        }}
      />

      {/* Trees layer */}
      {showTrees && (
        <div className="absolute inset-x-0 bottom-0 h-32 opacity-40">
          {trees.map(tree => (
            <PixelTree key={tree.id} tree={tree} />
          ))}
        </div>
      )}

      {/* Fireflies layer */}
      {showFireflies && (
        <div className="absolute inset-0">
          {fireflies.map(firefly => (
            <Firefly key={firefly.id} firefly={firefly} />
          ))}
        </div>
      )}

      {/* Ground */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-4"
        style={{
          backgroundColor: 'hsl(var(--pixel-green-dark))',
        }}
      />
    </div>
  );
};

export default ForestBackground;
