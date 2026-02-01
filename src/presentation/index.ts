/**
 * Presentation Layer Exports
 * Centralized exports for UI components, screens, and view models
 */

// Navigation
export { AppNavigator } from './navigation/AppNavigator';

// View Models
export { useAuthViewModel } from './viewmodel/AuthViewModel';
export { useSignupViewModel } from './viewmodel/SignupViewModel';

// Main Components
export { MainApp } from './ui/components/MainApp';

// Common Components
export { AddTaskModal } from './ui/components/AddTaskModal';
export { Card } from './ui/components/Card';
export { CustomButton } from './ui/components/CustomButton';
export { CustomInput } from './ui/components/CustomInput';

// Auth Screens
export { LoginScreen } from './ui/screens/auth/LoginScreen';
export { OTPVerificationScreen } from './ui/screens/auth/OTPVerificationScreen';
export { SignupScreen } from './ui/screens/auth/SignupScreen';

// Onboarding Screens
export { GetStartedScreen } from './ui/screens/onboarding/GetStartedScreen';
export { OnboardingFlow } from './ui/screens/onboarding/OnboardingFlow';

// Main Screens
export { DashboardScreen } from './ui/screens/main/DashboardScreen';
export { TasksScreen } from './ui/screens/main/TasksScreen';
export { ProfileScreen } from './ui/screens/profile/ProfileScreen';

// Hooks
export { useNotifications } from './hooks/useNotifications';
export { useTasks } from './hooks/useTasks';

// Context
export { ThemeProvider, useTheme } from './context/ThemeContext';
export type { Theme, ThemeMode } from './context/ThemeContext';

// Notification Components
export { NotificationSettings } from './ui/components/NotificationSettings';
export { NotificationStatus } from './ui/components/NotificationStatus';
export { NotificationTestPanel } from './ui/components/NotificationTestPanel';

