import { useState } from 'react';
import { LoginCredentials, User } from '../../domain/model/User';
import { GetCurrentUserUseCase } from '../../domain/usecase/GetCurrentUserUseCase';
import { LoginUseCase } from '../../domain/usecase/LoginUseCase';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export class AuthViewModel {
  private loginUseCase: LoginUseCase;
  private getCurrentUserUseCase: GetCurrentUserUseCase;

  constructor(loginUseCase: LoginUseCase, getCurrentUserUseCase: GetCurrentUserUseCase) {
    this.loginUseCase = loginUseCase;
    this.getCurrentUserUseCase = getCurrentUserUseCase;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    const result = await this.loginUseCase.execute(credentials);
    return {
      success: result.success,
      error: result.error
    };
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.getCurrentUserUseCase.execute();
  }
}

export const useAuthViewModel = (
  loginUseCase: LoginUseCase,
  getCurrentUserUseCase: GetCurrentUserUseCase
) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  });

  const viewModel = new AuthViewModel(loginUseCase, getCurrentUserUseCase);

  const login = async (credentials: LoginCredentials) => {
    console.log('🔐 AuthViewModel: Starting login process');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await viewModel.login(credentials);
      console.log('🔐 AuthViewModel: Login result:', result);
      
      if (result.success) {
        console.log('✅ AuthViewModel: Login successful, fetching user data');
        const user = await viewModel.getCurrentUser();
        console.log('👤 AuthViewModel: Current user:', user);
        
        setState(prev => ({
          ...prev,
          user,
          isAuthenticated: !!user?.isAuthenticated,
          isLoading: false,
          error: null,
        }));
        return { success: true };
      } else {
        console.log('❌ AuthViewModel: Login failed:', result.error);
        setState(prev => ({
          ...prev,
          error: result.error || 'Login failed',
          isLoading: false,
          isAuthenticated: false,
          user: null,
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ AuthViewModel: Login error:', error);
      setState(prev => ({
        ...prev,
        error: 'An unexpected error occurred',
        isLoading: false,
        isAuthenticated: false,
        user: null,
      }));
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const checkAuthStatus = async () => {
    console.log('🔍 AuthViewModel: Checking auth status');
    try {
      const user = await viewModel.getCurrentUser();
      console.log('👤 AuthViewModel: Current user from check:', user);
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user?.isAuthenticated,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('❌ AuthViewModel: Auth check error:', error);
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    }
  };

  const logout = () => {
    console.log('🚪 AuthViewModel: Logging out user');
    setState({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });
  };

  return {
    state,
    login,
    checkAuthStatus,
    logout,
  };
};
