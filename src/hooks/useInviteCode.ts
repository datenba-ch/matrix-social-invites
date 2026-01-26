import { useState, useCallback, useEffect } from 'react';

interface InviteCode {
  code: string;
  createdAt: number;
  expiresAt: number;
}

const STORAGE_KEY = 'datenbach_invite_code';
const EXPIRATION_DAYS = 7;
const CODE_LENGTH = 6;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars (I, O, 0, 1)

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

export function useInviteCode() {
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load code from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as InviteCode;
        // Check if code is still valid
        if (parsed.expiresAt > Date.now()) {
          setInviteCode(parsed);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const generateInviteCode = useCallback(async () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const now = Date.now();
    const newCode: InviteCode = {
      code: generateCode(),
      createdAt: now,
      expiresAt: now + (EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
    };
    
    setInviteCode(newCode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCode));
    setIsGenerating(false);
    
    return newCode;
  }, []);

  const regenerateCode = useCallback(async () => {
    return generateInviteCode();
  }, [generateInviteCode]);

  const clearCode = useCallback(() => {
    setInviteCode(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Calculate time remaining
  const getTimeRemaining = useCallback(() => {
    if (!inviteCode) return null;
    
    const remaining = inviteCode.expiresAt - Date.now();
    if (remaining <= 0) return null;
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return { days, hours, minutes, total: remaining };
  }, [inviteCode]);

  // Calculate progress (0-1)
  const getProgress = useCallback(() => {
    if (!inviteCode) return 0;

    const totalDuration = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    const remaining = inviteCode.expiresAt - Date.now();
    const elapsed = totalDuration - remaining;

    return Math.min(1, Math.max(0, elapsed / totalDuration));
  }, [inviteCode]);

  return {
    inviteCode,
    isGenerating,
    generateInviteCode,
    regenerateCode,
    clearCode,
    getTimeRemaining,
    getProgress,
    hasActiveCode: !!inviteCode && inviteCode.expiresAt > Date.now(),
  };
}
