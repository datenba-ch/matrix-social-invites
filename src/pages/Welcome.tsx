import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PixelCompanion from '@/components/PixelCompanion';
import PixelButton from '@/components/PixelButton';
import ForestBackground from '@/components/ForestBackground';

const Welcome: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated forest background */}
      <ForestBackground showFireflies={true} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Title */}
        <h1 className="font-pixel text-xl text-primary pixel-text mb-2">
          DATENBACH
        </h1>
        <p className="font-pixel text-[10px] text-muted-foreground mb-8">
          EINLADUNGSCODE GENERATOR
        </p>

        {/* Companion greeting */}
        <PixelCompanion 
          mood={isLoading ? 'excited' : 'happy'}
          message={isLoading ? "Anmeldung..." : "Willkommen im Wald! Bereit Einladungscodes zu erstellen?"}
          size="xl"
        />

        {/* Sign in button */}
        <div className="mt-12">
          <PixelButton
            variant="primary"
            size="lg"
            onClick={login}
            disabled={isLoading}
          >
            {isLoading ? 'ANMELDEN...' : 'ANMELDEN'}
          </PixelButton>
        </div>

        {/* Footer hint */}
        <p className="mt-8 font-pixel text-[8px] text-muted-foreground max-w-48">
          Melde dich mit deinem Matrix-Konto an, um Einladungscodes für Freunde zu erstellen
        </p>
      </div>
    </div>
  );
};

export default Welcome;
