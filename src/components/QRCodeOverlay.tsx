import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import PixelCompanion from './PixelCompanion';

interface QRCodeOverlayProps {
  code: string;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeOverlay: React.FC<QRCodeOverlayProps> = ({
  code,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm",
        "flex flex-col items-center justify-center p-6",
        "animate-fade-in cursor-pointer"
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="QR Code overlay"
    >
      {/* Companion waving goodbye */}
      <div className="absolute top-8 right-8">
        <PixelCompanion 
          mood="waving" 
          message="Scann mich!"
        />
      </div>

      {/* QR Code container */}
      <div className="bg-pixel-cream p-6 border-4 border-border pixel-shadow">
        <QRCodeSVG
          value={code}
          size={200}
          level="M"
          bgColor="hsl(45, 80%, 90%)"
          fgColor="hsl(140, 30%, 12%)"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Code display */}
      <div className="mt-6 flex gap-2">
        {code.split('').map((char, index) => (
          <div
            key={index}
            className="w-10 h-12 bg-card border-2 border-border flex items-center justify-center pixel-shadow"
          >
            <span className="font-pixel text-lg text-foreground">{char}</span>
          </div>
        ))}
      </div>

      {/* Dismiss hint */}
      <p className="mt-8 font-pixel text-[8px] text-muted-foreground">
        TIPPEN ZUM SCHLIESSEN
      </p>
    </div>
  );
};

export default QRCodeOverlay;
