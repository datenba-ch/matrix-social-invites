import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInviteCode } from '@/hooks/useInviteCode';
import PixelCompanion from '@/components/PixelCompanion';
import PixelButton from '@/components/PixelButton';
import BulletinBoard from '@/components/BulletinBoard';
import TearOffCode from '@/components/TearOffCode';
import CountdownWheel from '@/components/CountdownWheel';
import QRCodeOverlay from '@/components/QRCodeOverlay';
import ForestBackground from '@/components/ForestBackground';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type CompanionMood = 'idle' | 'happy' | 'excited' | 'sleeping' | 'waving' | 'thinking' | 'celebrating' | 'curious' | 'surprised';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    inviteCode,
    isGenerating,
    generateInviteCode,
    regenerateCode,
    hasActiveCode,
    getTimeRemaining,
    getProgress,
  } = useInviteCode();

  const [showQR, setShowQR] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [companionMood, setCompanionMood] = useState<CompanionMood>('idle');
  const [companionMessage, setCompanionMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
  const [justGenerated, setJustGenerated] = useState(false);

  // Update time remaining every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 60000);
    return () => clearInterval(interval);
  }, [getTimeRemaining]);

  // Update companion based on state
  useEffect(() => {
    if (isGenerating) {
      setCompanionMood('excited');
      setCompanionMessage('Erstelle deinen Code...');
    } else if (justGenerated) {
      setCompanionMood('celebrating');
      setCompanionMessage('Dein neuer Code ist bereit!');
      const timer = setTimeout(() => setJustGenerated(false), 3000);
      return () => clearTimeout(timer);
    } else if (hasActiveCode) {
      const remaining = getTimeRemaining();
      if (remaining && remaining.days <= 1) {
        setCompanionMood('curious');
        setCompanionMessage('Dein Code läuft bald ab!');
      } else if (remaining && remaining.days <= 3) {
        setCompanionMood('thinking');
        setCompanionMessage('Noch ein paar Tage für diesen Code.');
      } else {
        setCompanionMood('happy');
        setCompanionMessage('Dein Code ist bereit zum Teilen!');
      }
    } else {
      setCompanionMood('idle');
      setCompanionMessage('Erstelle einen neuen Einladungscode!');
    }
  }, [isGenerating, hasActiveCode, getTimeRemaining, justGenerated]);

  const handleGenerateCode = async () => {
    await generateInviteCode();
    setJustGenerated(true);
  };

  const handleRegenerateCode = async () => {
    setShowRegenerateDialog(false);
    await regenerateCode();
    setJustGenerated(true);
  };

  const handleSwipeRegenerate = () => {
    setShowRegenerateDialog(true);
  };

  const handleShowQR = () => {
    setCompanionMood('waving');
    setCompanionMessage('Zeig das deinem Freund!');
    setShowQR(true);
  };

  const handleCloseQR = () => {
    setShowQR(false);
    setCompanionMood('happy');
    setCompanionMessage('Dein Code ist bereit zum Teilen!');
  };

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 relative overflow-hidden">
      {/* Animated forest background */}
      <ForestBackground showFireflies={true} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel text-sm text-primary">DATENBACH</h1>
          <p className="font-pixel text-[8px] text-muted-foreground mt-1">
            {user?.displayName}
          </p>
        </div>
        <PixelButton variant="secondary" size="sm" onClick={logout}>
          ABMELDEN
        </PixelButton>
      </header>

      {/* Main content - restructured layout */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Companion in top third */}
        <div className="flex-none pt-2 pb-4 flex flex-col items-center">
          <PixelCompanion mood={companionMood} message={companionMessage} size="xl" />
        </div>

        {/* Bulletin board fills remaining space */}
        <BulletinBoard className="flex-1 max-w-sm">
          <div className="flex flex-col flex-1">
            {/* Top section - title and countdown */}
            <div className="text-center">
              <h2 className="font-pixel text-[10px] text-foreground mb-4">
                EINLADUNGSCODE
              </h2>

              {hasActiveCode && inviteCode && (
                <div className="flex justify-center">
                <CountdownWheel
                    progress={progress}
                    daysRemaining={timeRemaining?.days ?? 0}
                    hoursRemaining={timeRemaining?.hours ?? 0}
                    minutesRemaining={timeRemaining?.minutes ?? 0}
                  />
                </div>
              )}
            </div>

            {/* Bottom section - code and button pinned to bottom */}
            <div className="mt-auto text-center">
              {hasActiveCode && inviteCode ? (
                <>
                  {/* Tear-off code display with swipe support */}
                  <TearOffCode
                    code={inviteCode.code}
                    onClick={handleShowQR}
                    onSwipeLeft={handleSwipeRegenerate}
                  />

                  {/* Regenerate button */}
                  <div className="mt-6">
                    <PixelButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowRegenerateDialog(true)}
                      disabled={isGenerating}
                    >
                      NEUER CODE
                    </PixelButton>
                  </div>
                </>
              ) : (
                <>
                  {/* No code state */}
                  <p className="font-pixel text-[8px] text-muted-foreground mb-6">
                    Kein aktiver Code
                  </p>

                  {/* Generate button */}
                  <PixelButton
                    variant="primary"
                    size="lg"
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="animate-pulse-glow"
                  >
                    {isGenerating ? 'ERSTELLE...' : 'CODE ERSTELLEN'}
                  </PixelButton>
                </>
              )}
            </div>
          </div>
        </BulletinBoard>
      </main>

      {/* QR Code overlay */}
      {inviteCode && (
        <QRCodeOverlay
          code={inviteCode.code}
          isOpen={showQR}
          onClose={handleCloseQR}
        />
      )}

      {/* Regenerate confirmation dialog - fixed for small viewports */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent className="bg-card border-4 border-border fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-xs p-6">
          <AlertDialogHeader className="flex flex-col items-center space-y-4">
            <div className="flex justify-center">
              <PixelCompanion mood="surprised" message="Bist du sicher?" size="sm" />
            </div>
            <AlertDialogTitle className="font-pixel text-[10px] text-center">
              CODE NEU ERSTELLEN?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-pixel text-[8px] text-center text-muted-foreground leading-relaxed">
              Dies ersetzt deinen aktuellen Code. Der alte Code funktioniert dann nicht mehr.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center gap-3 mt-4 sm:justify-center">
            <AlertDialogCancel asChild>
              <PixelButton variant="ghost" size="sm">
                ABBRECHEN
              </PixelButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <PixelButton variant="primary" size="sm" onClick={handleRegenerateCode}>
                NEU ERSTELLEN
              </PixelButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
