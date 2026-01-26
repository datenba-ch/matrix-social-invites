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
      setCompanionMessage('Creating your code...');
    } else if (justGenerated) {
      setCompanionMood('celebrating');
      setCompanionMessage('Your new code is ready!');
      const timer = setTimeout(() => setJustGenerated(false), 3000);
      return () => clearTimeout(timer);
    } else if (hasActiveCode) {
      const remaining = getTimeRemaining();
      if (remaining && remaining.days <= 1) {
        setCompanionMood('curious');
        setCompanionMessage('Your code expires soon!');
      } else if (remaining && remaining.days <= 3) {
        setCompanionMood('thinking');
        setCompanionMessage('A few days left on this code.');
      } else {
        setCompanionMood('happy');
        setCompanionMessage('Your code is ready to share!');
      }
    } else {
      setCompanionMood('idle');
      setCompanionMessage('Generate a new invite code!');
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
    setCompanionMessage('Show this to your friend!');
    setShowQR(true);
  };

  const handleCloseQR = () => {
    setShowQR(false);
    setCompanionMood('happy');
    setCompanionMessage('Your code is ready to share!');
  };

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 relative overflow-hidden">
      {/* Animated forest background */}
      <ForestBackground showFireflies={true} showTrees={false} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between mb-6">
        <div>
          <h1 className="font-pixel text-sm text-primary">DATENBACH</h1>
          <p className="font-pixel text-[8px] text-muted-foreground mt-1">
            {user?.displayName}
          </p>
        </div>
        <PixelButton variant="ghost" size="sm" onClick={logout}>
          LOGOUT
        </PixelButton>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Companion */}
        <div className="mb-6">
          <PixelCompanion mood={companionMood} message={companionMessage} size="md" />
        </div>

        {/* Bulletin board */}
        <BulletinBoard className="mb-6">
          <div className="text-center">
            <h2 className="font-pixel text-[10px] text-foreground mb-4">
              INVITE CODE
            </h2>

            {hasActiveCode && inviteCode ? (
              <>
                {/* Countdown wheel */}
                <div className="flex justify-center mb-4">
                  <CountdownWheel
                    progress={progress}
                    daysRemaining={timeRemaining?.days ?? 0}
                    hoursRemaining={timeRemaining?.hours ?? 0}
                  />
                </div>

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
                    NEW CODE
                  </PixelButton>
                </div>
              </>
            ) : (
              <>
                {/* No code state */}
                <p className="font-pixel text-[8px] text-muted-foreground mb-6">
                  No active code
                </p>

                {/* Generate button */}
                <PixelButton
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className="animate-pulse-glow"
                >
                  {isGenerating ? 'CREATING...' : 'GENERATE CODE'}
                </PixelButton>
              </>
            )}
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
        <AlertDialogContent className="bg-card border-4 border-border max-w-[calc(100vw-2rem)] w-full sm:max-w-xs mx-4">
          <AlertDialogHeader className="space-y-4">
            <div className="flex justify-center">
              <PixelCompanion mood="surprised" message="Are you sure?" size="sm" />
            </div>
            <AlertDialogTitle className="font-pixel text-[10px] text-center">
              REGENERATE CODE?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-pixel text-[8px] text-center text-muted-foreground leading-relaxed">
              This will replace your current code. The old code will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-center gap-2 sm:gap-4 mt-4">
            <AlertDialogCancel asChild>
              <PixelButton variant="ghost" size="sm">
                CANCEL
              </PixelButton>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <PixelButton variant="primary" size="sm" onClick={handleRegenerateCode}>
                REGENERATE
              </PixelButton>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
