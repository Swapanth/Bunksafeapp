import { AppNotificationInitializer } from '@/src/core/services/AppNotificationInitializer';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { auth } from '../../config/firebase';
import { DIContainer } from '../../core/di/DIContainer';
import { LoginCredentials, User } from '../../domain/model/User';
import { MainApp } from '../ui/components/MainApp';
import { LoginScreen } from '../ui/screens/auth/LoginScreen';
import { GetStartedScreen } from '../ui/screens/onboarding/GetStartedScreen';
import { OnboardingFlow } from '../ui/screens/onboarding/OnboardingFlow';
import { useAuthViewModel } from '../viewmodel/AuthViewModel';

export type AppState = 'getStarted' | 'login' | 'signup' | 'dashboard';

interface AppNavigatorProps {
  initialScreen?: AppState;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  initialScreen = 'getStarted'
}) => {
  const [currentScreen, setCurrentScreen] = useState<AppState>(initialScreen);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { state, login, checkAuthStatus, logout: logoutFromViewModel } = useAuthViewModel(
    DIContainer.loginUseCase,
    DIContainer.getCurrentUserUseCase
  );

  // Check authentication status on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 Waiting for Firebase auth state restoration...');
        
        // Wait for Firebase to restore auth state from AsyncStorage
        // This is critical to prevent auto-logout when app is closed/reopened
        await new Promise<void>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            console.log('🔥 Firebase auth state restored:', firebaseUser ? firebaseUser.email : 'No user');
            
            // Unsubscribe immediately after first emission
            unsubscribe();
            
            // Now check our app's auth status
            await checkAuthStatus();

            if (state.isAuthenticated && state.user) {
              console.log('✅ User is authenticated:', state.user.email);
              setCurrentUser(state.user);
              setCurrentScreen('dashboard');
            } else {
              console.log('❌ User is not authenticated');
              // Only set to getStarted if we're still on the initial screen
              if (currentScreen === initialScreen) {
                setCurrentScreen('getStarted');
              }
            }
            
            resolve();
          });
        });
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        setCurrentScreen('getStarted');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []); // Only run once on mount

  // React to auth state changes and initialize notifications
  useEffect(() => {
    if (!isInitializing) {
      if (state.isAuthenticated && state.user) {
        console.log('🔄 Auth state changed - user authenticated:', state.user.email);
        setCurrentUser(state.user);

        // Initialize notifications for authenticated user
        const initializeNotifications = async () => {
          try {
            const notificationInitializer = AppNotificationInitializer.getInstance();
            await notificationInitializer.initialize(state.user!.id);
            console.log('📱 Notifications initialized for user:', state.user!.email);
          } catch (error) {
            console.error('📱 Failed to initialize notifications:', error);
          }
        };

        initializeNotifications();

        if (currentScreen !== 'dashboard') {
          setCurrentScreen('dashboard');
        }
      } else if (!state.isAuthenticated && currentUser) {
        console.log('🔄 Auth state changed - user logged out');

        // Cleanup notifications on logout
        const cleanupNotifications = async () => {
          try {
            const notificationInitializer = AppNotificationInitializer.getInstance();
            await notificationInitializer.cleanup();
            console.log('📱 Notifications cleaned up');
          } catch (error) {
            console.error('📱 Failed to cleanup notifications:', error);
          }
        };

        cleanupNotifications();
        setCurrentUser(null);
        setCurrentScreen('login');
      }
    }
  }, [state.isAuthenticated, state.user, isInitializing, currentScreen, currentUser]);


  const handleGetStartedComplete = () => {
    setCurrentScreen('login');
  };

  const handleGetStartedSkip = () => {
    setCurrentScreen('login');
  };

  const handleSignupPress = () => {
    setCurrentScreen('signup');
  };

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      const result = await DIContainer.completeOnboardingUseCase.execute(onboardingData);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setCurrentScreen('dashboard');
      } else {
        console.error('Onboarding failed:', result.error);
        // TODO: Show error message to user
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    }
  };

  const handleLoginSuccess = () => {
    console.log('🎉 Login successful, current auth state:', state);
    // The useEffect will handle the navigation when state updates
  };

  const handleLogin = async (credentials: LoginCredentials) => {
    console.log('🔐 Attempting login for:', credentials.email);
    const result = await login(credentials);
    console.log('🔐 Login result:', result);
    return result;
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out user...');
      await DIContainer.authRepository.logout();
      logoutFromViewModel();
      setCurrentUser(null);
      setCurrentScreen('login');
      console.log('✅ Logout complete, redirected to login');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const renderCurrentScreen = () => {
    // Show loading screen while initializing
    if (isInitializing) {
      return (
        <View className="flex-1 justify-center items-center bg-white">
          <View className="items-center">
            <Text className="text-4xl mb-4">🔐</Text>
            <Text className="text-lg text-gray-600">Checking authentication...</Text>
          </View>
        </View>
      );
    }

    switch (currentScreen) {
      case 'getStarted':
        return <GetStartedScreen onComplete={handleGetStartedComplete} onSkip={handleGetStartedSkip} />;
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onLogin={handleLogin}
            onSignupPress={handleSignupPress}
          />
        );
      case 'signup':
        return (
          <OnboardingFlow
            onComplete={handleOnboardingComplete}
            onBack={() => setCurrentScreen('login')}
          />
        );
          
      case 'dashboard':
        return (
          <MainApp
            user={currentUser!}
            onLogout={handleLogout}
          />
        );

      default:
        return <GetStartedScreen onComplete={handleGetStartedComplete} onSkip={handleGetStartedSkip} />;
    }
  };

  return renderCurrentScreen();
};