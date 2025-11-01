import { useCallback, useEffect, useState } from 'react';
import { AppLogger } from '../../core/utils/Logger';
import { RecaptchaService } from '../../data/services/RecaptchaService';

export interface UseRecaptchaResult {
  showRecaptcha: boolean;
  recaptchaToken: string | null;
  recaptchaError: string | null;
  showRecaptchaModal: () => void;
  hideRecaptchaModal: () => void;
  handleRecaptchaSuccess: (token: string) => void;
  handleRecaptchaError: (error: string) => void;
  resetRecaptcha: () => void;
}

/**
 * Hook to manage reCAPTCHA state and interactions
 */
export const useRecaptcha = (): UseRecaptchaResult => {
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const recaptchaService = RecaptchaService.getInstance();

  // Monitor the RecaptchaService for pending requests
  useEffect(() => {
    const checkPendingRequest = () => {
      const hasPending = recaptchaService.hasPendingRequest();
      
      if (hasPending && !showRecaptcha) {
        AppLogger.info('reCAPTCHA request detected, showing modal');
        setShowRecaptcha(true);
        setRecaptchaError(null);
      } else if (!hasPending && showRecaptcha) {
        AppLogger.info('No pending reCAPTCHA request, hiding modal');
        setShowRecaptcha(false);
      }
      
      // Debug logging every few seconds
      if (Date.now() % 5000 < 500) {
        AppLogger.info('reCAPTCHA state check', {
          hasPending,
          showRecaptcha,
          recaptchaToken: !!recaptchaToken,
          recaptchaError: !!recaptchaError
        });
      }
    };

    // Check immediately
    checkPendingRequest();

    // Set up polling to check for pending requests
    const interval = setInterval(checkPendingRequest, 500);

    return () => clearInterval(interval);
  }, [recaptchaService, showRecaptcha, recaptchaToken, recaptchaError]);

  const showRecaptchaModal = useCallback(() => {
    AppLogger.info('Manually showing reCAPTCHA modal');
    setShowRecaptcha(true);
    setRecaptchaError(null);
  }, []);

  const hideRecaptchaModal = useCallback(() => {
    AppLogger.info('Hiding reCAPTCHA modal');
    setShowRecaptcha(false);
    // Only resolve with error if there's actually a pending request
    if (recaptchaService.hasPendingRequest()) {
      recaptchaService.resolveWithError('User cancelled security verification');
    }
  }, [recaptchaService]);

  const handleRecaptchaSuccess = useCallback((token: string) => {
    AppLogger.info('reCAPTCHA completed successfully');
    setRecaptchaToken(token);
    setRecaptchaError(null);
    setShowRecaptcha(false);
    // The service is already notified by the RecaptchaModal component
  }, []);

  const handleRecaptchaError = useCallback((error: string) => {
    AppLogger.error('reCAPTCHA error:', error);
    setRecaptchaError(error);
    setRecaptchaToken(null);
    setShowRecaptcha(false);
    // The service is already notified by the RecaptchaModal component
  }, []);

  const resetRecaptcha = useCallback(() => {
    AppLogger.info('Resetting reCAPTCHA state');
    setRecaptchaToken(null);
    setRecaptchaError(null);
    setShowRecaptcha(false);
  }, []);

  return {
    showRecaptcha,
    recaptchaToken,
    recaptchaError,
    showRecaptchaModal,
    hideRecaptchaModal,
    handleRecaptchaSuccess,
    handleRecaptchaError,
    resetRecaptcha,
  };
};