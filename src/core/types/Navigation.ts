/**
 * Navigation Types
 * Type definitions for navigation and routing
 */

export type AppScreen = 
  | 'getStarted' 
  | 'login' 
  | 'signup' 
  | 'dashboard';

export type MainTabScreen = 
  | 'dashboard' 
  | 'tasks' 
  | 'friends' 
  | 'classroom' 
  | 'profile';

export type AuthScreen = 
  | 'login' 
  | 'signup' 
  | 'otpVerification';

export type OnboardingScreen = 
  | 'getStarted'
  | 'signup'
  | 'otpVerification'
  | 'universitySelection'
  | 'profileSetup'
  | 'classroomSetup'
  | 'timetableUpload'
  | 'welcome';

export interface NavigationProps {
  onNavigate?: (screen: AppScreen) => void;
  onBack?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}