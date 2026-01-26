import { useState, useCallback, useEffect } from 'react';

interface InviteCode {
  code: string;
  createdAt: number;
  expiresAt: number;
}

const EXPIRATION_DAYS = 7;
const API_BASE = '/api/invites';

export function useInviteCode() {
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCurrentInvite = useCallback(async () => {
    const response = await fetch(`${API_BASE}/current`, {
      credentials: 'include',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to load invite code.');
    }

    return (await response.json()) as InviteCode;
  }, []);

  // Load code from API on mount
  useEffect(() => {
    let isMounted = true;

    fetchCurrentInvite()
      .then((data) => {
        if (isMounted) {
          setInviteCode(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setInviteCode(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchCurrentInvite]);

  const generateInviteCode = useCallback(async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create invite code.');
      }

      const newCode = (await response.json()) as InviteCode;
      setInviteCode(newCode);
      return newCode;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const regenerateCode = useCallback(async () => {
    return generateInviteCode();
  }, [generateInviteCode]);

  const clearCode = useCallback(() => {
    setInviteCode(null);

    void fetch(`${API_BASE}/current`, {
      method: 'DELETE',
      credentials: 'include',
    }).catch(() => {});
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
