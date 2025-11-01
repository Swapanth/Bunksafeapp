import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { FirebaseNotificationService, UserNotificationSettings } from '../../data/services/NotificationBackendService';
import { NotificationService } from '../../data/services/NotificationClientService';

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export const useNotifications = (userId?: string) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
    granted: false,
    canAskAgain: true,
    status: 'undetermined',
  });
  const [settings, setSettings] = useState<UserNotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationService = NotificationService.getInstance();
  const firebaseNotificationService = FirebaseNotificationService.getInstance();

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Initialize notification service
      await notificationService.initialize();
      
      // Get permission status
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      setPermissionStatus({
        granted: status === 'granted',
        canAskAgain,
        status,
      });

      // Get push token
      const token = notificationService.getExpoPushToken();
      setExpoPushToken(token);

      // Load user settings if userId is provided
      if (userId) {
        const userSettings = await firebaseNotificationService.getUserNotificationSettings(userId);
        setSettings(userSettings);

        // Save push token to user profile if we have one
        if (token) {
          await firebaseNotificationService.updateUserPushToken(userId, token);
          await notificationService.savePushTokenToUser(userId);
        }
      }
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, notificationService, firebaseNotificationService]);

  // Request notification permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      
      setPermissionStatus(prev => ({
        ...prev,
        granted,
        status,
        canAskAgain: status !== 'denied',
      }));

      if (granted) {
        // Re-initialize to get push token
        await initializeNotifications();
      }

      return granted;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }, [initializeNotifications]);

  // Update notification settings
  const updateSettings = useCallback(async (
    newSettings: Partial<UserNotificationSettings>
  ): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required to update settings');
    }

    try {
      const updatedSettings = { ...settings, ...newSettings, userId };
      await firebaseNotificationService.saveUserNotificationSettings(updatedSettings);
      setSettings(updatedSettings as UserNotificationSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }, [userId, settings, firebaseNotificationService]);

  // Schedule daily reminder
  const scheduleDailyReminder = useCallback(async (
    hour: number = 9,
    minute: number = 0
  ): Promise<void> => {
    try {
      await notificationService.scheduleDailyReminder(hour, minute);
      
      if (userId) {
        await updateSettings({ reminderHour: hour, reminderMinute: minute });
      }
    } catch (error) {
      console.error('Failed to schedule daily reminder:', error);
      throw error;
    }
  }, [notificationService, updateSettings, userId]);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('Failed to cancel notifications:', error);
      throw error;
    }
  }, [notificationService]);

  // Get scheduled notifications
  const getScheduledNotifications = useCallback(async () => {
    try {
      return await notificationService.getScheduledNotifications();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }, [notificationService]);

  // Clear badge count
  const clearBadge = useCallback(async (): Promise<void> => {
    try {
      await notificationService.clearBadge();
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }, [notificationService]);

  // Initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  return {
    // State
    permissionStatus,
    settings,
    isLoading,
    expoPushToken,
    
    // Actions
    requestPermissions,
    updateSettings,
    scheduleDailyReminder,
    cancelAllNotifications,
    getScheduledNotifications,
    clearBadge,
    
    // Services (for advanced usage)
    notificationService,
    firebaseNotificationService,
  };
};