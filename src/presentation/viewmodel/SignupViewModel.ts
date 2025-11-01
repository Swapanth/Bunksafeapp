import { useState } from 'react';
import { AuthResult, SignupData } from '../../domain/model/User';
import { SignupUseCase } from '../../domain/usecase/SignupUseCase';

interface SignupState {
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
}

export const useSignupViewModel = (signupUseCase: SignupUseCase) => {
  const [state, setState] = useState<SignupState>({
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const signup = async (signupData: SignupData): Promise<AuthResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await signupUseCase.execute(signupData);
      
      if (result.success) {
        setState(prev => ({ ...prev, isLoading: false, isSuccess: true }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Signup failed',
          isSuccess: false 
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage,
        isSuccess: false 
      }));
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      isSuccess: false,
    });
  };

  return {
    state,
    signup,
    clearError,
    reset,
  };
};
