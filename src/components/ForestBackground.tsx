import React, { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import forestWallpaper from '@/assets/forest-wallpaper.png';

interface ForestBackgroundProps {
  className?: string;
  showFireflies?: boolean;
  interactionPoint?: { x: number; y: number };
  interactionActive?: boolean;
}

interface Firefly {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
}

interface FireflyIntensity {
  opacity: number;
  glowAlpha: number;
  spread: number;
}

const Firefly: React.FC<{ firefly: Firefly; intensity: FireflyIntensity }> = ({ firefly, intensity }) => {
  const glowSpread = firefly.size * 2 * intensity.spread;
  const glowColor = `rgba(255, 245, 210, ${intensity.glowAlpha})`;

  return (
    <div
      className="absolute rounded-full animate-firefly day-night-firefly"
      style={{
        left: `${firefly.x}%`,
        top: `${firefly.y}%`,
        width: firefly.size,
        height: firefly.size,
        backgroundColor: 'hsl(60, 100%, 70%)',
        opacity: intensity.opacity,
        boxShadow: `0 0 ${glowSpread}px ${firefly.size}px ${glowColor}`,
        filter: `drop-shadow(0 0 ${glowSpread * 0.65}px rgba(255, 235, 200, ${intensity.glowAlpha}))`,
        animationDelay: `${firefly.delay}s`,
        animationDuration: `${firefly.duration}s`,
      }}
    />
  );
};

type RGBA = [number, number, number, number];

const tintStops: Array<{ t: number; color: RGBA }> = [
  { t: 0, color: [255, 190, 130, 0.45] },
  { t: 0.08, color: [255, 215, 170, 0.3] },
  { t: 0.18, color: [255, 240, 220, 0.16] },
  { t: 0.3, color: [255, 210, 170, 0.24] },
  { t: 0.42, color: [200, 170, 220, 0.33] },
  { t: 0.55, color: [160, 180, 210, 0.42] },
  { t: 0.62, color: [80, 110, 170, 0.55] },
  { t: 0.74, color: [18, 36, 100, 0.7] },
  { t: 0.88, color: [10, 25, 70, 0.82] },
  { t: 1, color: [255, 190, 130, 0.45] },
];

const glowStops: Array<{ t: number; color: RGBA; radius: number; x: number; y: number }> = [
  { t: 0, color: [255, 205, 150, 0.45], radius: 45, x: 35, y: 30 },
  { t: 0.1, color: [255, 225, 180, 0.33], radius: 48, x: 40, y: 28 },
  { t: 0.2, color: [255, 245, 210, 0.24], radius: 55, x: 45, y: 30 },
  { t: 0.32, color: [255, 210, 170, 0.3], radius: 58, x: 52, y: 33 },
  { t: 0.48, color: [220, 160, 200, 0.4], radius: 60, x: 68, y: 38 },
  { t: 0.6, color: [140, 120, 200, 0.5], radius: 66, x: 70, y: 40 },
  { t: 0.72, color: [25, 45, 110, 0.6], radius: 70, x: 63, y: 45 },
  { t: 0.86, color: [15, 30, 80, 0.75], radius: 75, x: 55, y: 52 },
  { t: 1, color: [255, 205, 150, 0.45], radius: 50, x: 35, y: 30 },
];

const fireflyStops: Array<{ t: number; opacity: number; glowAlpha: number; spread: number }> = [
  { t: 0, opacity: 0.9, glowAlpha: 0.6, spread: 1.2 },
  { t: 0.2, opacity: 0.6, glowAlpha: 0.4, spread: 0.9 },
  { t: 0.4, opacity: 0.4, glowAlpha: 0.2, spread: 0.7 },
  { t: 0.6, opacity: 0.75, glowAlpha: 0.55, spread: 1.3 },
  { t: 0.8, opacity: 1, glowAlpha: 0.85, spread: 1.6 },
  { t: 1, opacity: 0.9, glowAlpha: 0.6, spread: 1.2 },
];

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const lerp = (start: number, end: number, ratio: number) => start + (end - start) * ratio;

const interpolateStops = <T extends { t: number }>(stops: T[], progress: number) => {
  const normalized = ((progress % 1) + 1) % 1;

  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i];
    const next = stops[i + 1];

    if (normalized >= current.t && normalized <= next.t) {
      const span = next.t - current.t || 1;
      return { start: current, end: next, ratio: (normalized - current.t) / span };
    }
  }

  const last = stops[stops.length - 1];
  const first = stops[0];
  const span = 1 - last.t + first.t || 1;
  const adjusted = normalized >= last.t ? normalized - last.t : normalized + (1 - last.t);

  return { start: last, end: first, ratio: adjusted / span };
};

const interpolateColor = (start: RGBA, end: RGBA, ratio: number): RGBA => [
  lerp(start[0], end[0], ratio),
  lerp(start[1], end[1], ratio),
  lerp(start[2], end[2], ratio),
  lerp(start[3], end[3], ratio),
];

const colorToString = (color: RGBA) =>
  `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${Number(color[3].toFixed(2))})`;

const getDayProgress = () => {
  const now = new Date();
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + seconds;
  return totalSeconds / 86400;
};

export const ForestBackground: React.FC<ForestBackgroundProps> = ({
  className,
  showFireflies = true,
  interactionPoint,
  interactionActive,
}) => {
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [dayProgress, setDayProgress] = useState(getDayProgress());

  const dayNightStyles = useMemo(() => {
    const tint = interpolateStops(tintStops, dayProgress);
    const glow = interpolateStops(glowStops, dayProgress);
    const fireflyIntensity = interpolateStops(fireflyStops, dayProgress);

    const tintColor = colorToString(interpolateColor(tint.start.color, tint.end.color, tint.ratio));
    const glowColor = colorToString(interpolateColor(glow.start.color, glow.end.color, glow.ratio));
    const glowRadius = lerp(glow.start.radius, glow.end.radius, glow.ratio);
    const glowX = lerp(glow.start.x, glow.end.x, glow.ratio);
    const glowY = lerp(glow.start.y, glow.end.y, glow.ratio);

    const fireflyValues: FireflyIntensity = {
      opacity: lerp(fireflyIntensity.start.opacity, fireflyIntensity.end.opacity, fireflyIntensity.ratio),
      glowAlpha: lerp(fireflyIntensity.start.glowAlpha, fireflyIntensity.end.glowAlpha, fireflyIntensity.ratio),
      spread: lerp(fireflyIntensity.start.spread, fireflyIntensity.end.spread, fireflyIntensity.ratio),
    };

    return {
      tintStyle: { backgroundColor: tintColor },
      glowStyle: {
        background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}, transparent ${glowRadius}%)`,
      },
      fireflyIntensity: fireflyValues,
    };
  }, [dayProgress]);

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
      return;
    }

    setFireflies([]);
  }, [showFireflies]);

  useEffect(() => {
    if (!showFireflies) {
      return;
    }

    let frameId: number;
    const shouldAttract = Boolean(interactionPoint) && (interactionActive ?? true);

    const animate = () => {
      setFireflies((prev) => {
        if (prev.length === 0) {
          return prev;
        }

        return prev.map((firefly) => {
          const next = { ...firefly };

          if (interactionPoint && shouldAttract) {
            const dx = next.x - interactionPoint.x;
            const dy = next.y - interactionPoint.y;
            const distance = Math.max(Math.hypot(dx, dy), 0.0001);
            const targetRadius = 8 + firefly.size * 1.2;
            const radialDiff = distance - targetRadius;
            const radialPull = radialDiff * 0.035;
            const orbitSpeed = 0.045;
            const angle = Math.atan2(dy, dx);

            next.x -= (dx / distance) * radialPull;
            next.y -= (dy / distance) * radialPull;
            next.x += Math.cos(angle + Math.PI / 2) * orbitSpeed;
            next.y += Math.sin(angle + Math.PI / 2) * orbitSpeed;
            next.x += (Math.random() - 0.5) * 0.15;
            next.y += (Math.random() - 0.5) * 0.15;
          } else {
            next.x += (Math.random() - 0.5) * 0.3;
            next.y += (Math.random() - 0.5) * 0.3;
          }

          next.x = clampValue(next.x, 0, 100);
          next.y = clampValue(next.y, 5, 95);
          return next;
        });
      });

      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [interactionPoint, interactionActive, showFireflies]);

  useEffect(() => {
    const tick = () => setDayProgress(getDayProgress());
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

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

      {/* Day/Night colorization layers */}
      <div className="absolute inset-0 day-night-tint" style={dayNightStyles.tintStyle} />
      <div className="absolute inset-0 day-night-glow" style={dayNightStyles.glowStyle} />

      {/* Dark overlay for better UI contrast */}
      <div className="absolute inset-0 bg-background/40" />

      {/* Fireflies layer */}
      {showFireflies && (
        <div className="absolute inset-0">
          {fireflies.map((firefly) => (
            <Firefly key={firefly.id} firefly={firefly} intensity={dayNightStyles.fireflyIntensity} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ForestBackground;
