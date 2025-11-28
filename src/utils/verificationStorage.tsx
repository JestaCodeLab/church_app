/**
 * Verification State Storage
 * Manages temporary registration data during email verification
 */

interface VerificationData {
  email: string;
  churchName: string;
  timestamp: number;
}

const VERIFICATION_KEY = 'pending_verification';
const EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

export const verificationStorage = {
  save: (email: string, churchName: string) => {
    const data: VerificationData = {
      email,
      churchName,
      timestamp: Date.now(),
    };
    localStorage.setItem(VERIFICATION_KEY, JSON.stringify(data));
  },

  get: (): VerificationData | null => {
    try {
      const stored = localStorage.getItem(VERIFICATION_KEY);
      if (!stored) return null;

      const data: VerificationData = JSON.parse(stored);
      
      // Check if expired (30 minutes)
      if (Date.now() - data.timestamp > EXPIRY_TIME) {
        verificationStorage.clear();
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem(VERIFICATION_KEY);
  },

  hasPending: (): boolean => {
    return verificationStorage.get() !== null;
  },
};
