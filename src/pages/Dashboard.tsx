import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInviteCode } from '@/hooks/useInviteCode';
import PixelCompanion from '@/components/PixelCompanion';
import PixelButton from '@/components/PixelButton';
import BulletinBoard from '@/components/BulletinBoard';
import TearOffCode from '@/components/TearOffCode';
import CountdownWheel from '@/components/CountdownWheel';
import QRCodeOverlay from '@/components/QRCodeOverlay';
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

type CompanionMood = 'idle' | 'happy' | 'excited' | 'sleeping' | 'waving' | 'thinking';

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
    } else if (hasActiveCode) {
      const remaining = getTimeRemaining();
      if (remaining && remaining.days <= 1) {
        setCompanionMood('thinking');
        setCompanionMessage('Your code expires soon!');
      } else {
        setCompanionMood('happy');
        setCompanionMessage('Your code is ready to share!');
      }
    } else {
      setCompanionMood('idle');
      setCompanionMessage('Generate a new invite code!');
    }
  }, [isGenerating, hasActiveCode, getTimeRemaining]);

  const handleGenerateCode = async () => {
    await generateInviteCode();
    setCompanionMood('excited');
    setCompanionMessage('Your new code is ready!');
  };

  const handleRegenerateCode = async () => {
    setShowRegenerateDialog(false);
    await regenerateCode();
    setCompanionMood('excited');
    setCompanionMessage('Fresh code generated!');
  };

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
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
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Companion */}
        <div className="mb-6">
          <PixelCompanion mood={companionMood} message={companionMessage} />
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

                {/* Tear-off code display */}
                <TearOffCode
                  code={inviteCode.code}
                  onClick={() => setShowQR(true)}
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
          onClose={() => setShowQR(false)}
        />
      )}

      {/* Regenerate confirmation dialog */}
      <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
        <AlertDialogContent className="bg-card border-4 border-border max-w-xs">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <PixelCompanion mood="thinking" message="Are you sure?" />
            </div>
            <AlertDialogTitle className="font-pixel text-[10px] text-center">
              REGENERATE CODE?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-pixel text-[8px] text-center text-muted-foreground">
              This will replace your current code. Anyone with the old code won't be able to use it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-center gap-4">
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
