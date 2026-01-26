import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PixelCompanion from '@/components/PixelCompanion';
import PixelButton from '@/components/PixelButton';

const Welcome: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Forest background pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, hsl(var(--pixel-green-light)) 0%, transparent 30%),
            radial-gradient(circle at 80% 20%, hsl(var(--pixel-green-light)) 0%, transparent 25%),
            radial-gradient(circle at 50% 50%, hsl(var(--pixel-green-light)) 0%, transparent 40%)
          `
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Title */}
        <h1 className="font-pixel text-xl text-primary pixel-text mb-2">
          DATENBACH
        </h1>
        <p className="font-pixel text-[10px] text-muted-foreground mb-8">
          INVITE CODE GENERATOR
        </p>

        {/* Companion greeting */}
        <PixelCompanion 
          mood={isLoading ? 'excited' : 'happy'}
          message={isLoading ? "Logging in..." : "Welcome to the forest! Ready to create invite codes?"}
        />

        {/* Sign in button */}
        <div className="mt-12">
          <PixelButton
            variant="primary"
            size="lg"
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </PixelButton>
        </div>

        {/* Footer hint */}
        <p className="mt-8 font-pixel text-[8px] text-muted-foreground max-w-48">
          Sign in with your Matrix account to create invite codes for friends
        </p>
      </div>

      {/* Decorative trees */}
      <div className="fixed bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              hsl(var(--pixel-green-light) / 0.3) 40px,
              hsl(var(--pixel-green-light) / 0.3) 60px,
              transparent 60px,
              transparent 100px
            )
          `
        }}
      />
    </div>
  );
};

export default Welcome;
