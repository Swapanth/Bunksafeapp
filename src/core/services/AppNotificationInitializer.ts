import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationBackendService } from '../../data/services/NotificationBackendService';
import { NotificationClientService } from '../../data/services/NotificationClientService';
import { AttendanceCronService } from './AttendanceCronService';

export class AppNotificationInitializer {
  private static instance: AppNotificationInitializer;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AppNotificationInitializer {
    if (!AppNotificationInitializer.instance) {
      AppNotificationInitializer.instance = new AppNotificationInitializer();
    }
    return AppNotificationInitializer.instance;
  }

  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('Notification system already initialized');
      return;
    }

    try {
      console.log('Initializing notification system...');
      
      // Check if NotificationService is available (not available in Expo Go)
      if (!NotificationClientService || typeof NotificationClientService.getInstance !== 'function') {
        console.warn('NotificationService not available - skipping notification initialization');
        return;
      }
      
      const notificationService = NotificationClientService.getInstance();
      const firebaseNotificationService = NotificationBackendService.getInstance();

      // Initialize notification service
      await notificationService.initialize();

      // If user is logged in, set up user-specific notifications
      if (userId) {
        await this.setupUserNotifications(userId, notificationService, firebaseNotificationService);
        
        // Set up callback to update push token when it becomes available
        notificationService.setPushTokenCallback(async (token: string) => {
          try {
            await this.updatePushTokenForUser(userId);
          } catch (error) {
            console.error('Failed to update push token via callback:', error);
          }
        });
        
        // Initialize attendance cron service
        const attendanceCronService = AttendanceCronService.getInstance();
        await attendanceCronService.initialize(userId);
      }

      // Set up notification response handlers
      this.setupNotificationHandlers();

      // Schedule daily cleanup
      this.scheduleDailyCleanup(userId, firebaseNotificationService);

      this.isInitialized = true;
      console.log('Notification system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification system:', error);
    }
  }

  private async setupUserNotifications(
    userId: string,
    notificationService: NotificationClientService,
    firebaseNotificationService: NotificationBackendService
  ): Promise<void> {
    try {
      // Get or create user notification settings
      let settings = await firebaseNotificationService.getUserNotificationSettings(userId);
      
      // Get the push token (this might be null if not available yet)
      const pushToken = notificationService.getExpoPushToken();
      
      if (!settings) {
        // Create default settings for new user
        const defaultSettings = {
          userId,
          taskCreated: true,
          taskCompleted: true,
          deadlineReminders: true,
          dailyReminders: true,
          weeklyReports: true,
          messageNotifications: true,
          reminderHour: 9,
          reminderMinute: 0,
          // Only include expoPushToken if it's available (not null/undefined)
          ...(pushToken && { expoPushToken: pushToken }),
        };
        
        await firebaseNotificationService.saveUserNotificationSettings(defaultSettings);
        settings = defaultSettings as any;
      }

      // Ensure settings is not null before proceeding
      if (!settings) {
        throw new Error('Failed to create or retrieve user notification settings');
      }

      // Update push token if available and different from stored token
      if (pushToken && pushToken !== settings.expoPushToken) {
        await firebaseNotificationService.updateUserPushToken(userId, pushToken);
      }

      // Schedule daily reminders if enabled
      if (settings.dailyReminders) {
        await notificationService.scheduleDailyReminder(
          settings.reminderHour,
          settings.reminderMinute
        );
      }

      console.log('User notification settings configured');
    } catch (error) {
      console.error('Failed to setup user notifications:', error);
    }
  }

  private setupNotificationHandlers(): void {
    // This would typically integrate with your navigation system
    // For now, we'll just log the actions
    console.log('Notification handlers set up');
  }

  private scheduleDailyCleanup(
    userId: string | undefined,
    firebaseNotificationService: NotificationBackendService
  ): void {
    // Schedule cleanup of old notifications (runs once per day)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM next day

    const timeUntilCleanup = tomorrow.getTime() - now.getTime();

    setTimeout(async () => {
      if (userId) {
        try {
          await firebaseNotificationService.cleanupOldNotifications(userId, 30);
          console.log('Daily notification cleanup completed');
        } catch (error) {
          console.error('Failed to cleanup old notifications:', error);
        }
      }

      // Schedule next cleanup
      this.scheduleDailyCleanup(userId, firebaseNotificationService);
    }, timeUntilCleanup);
  }

  // Method to reinitialize when user logs in
  async reinitializeForUser(userId: string): Promise<void> {
    const notificationService = NotificationClientService.getInstance();
    const firebaseNotificationService = NotificationBackendService.getInstance();

    await this.setupUserNotifications(userId, notificationService, firebaseNotificationService);
    
    // Reinitialize attendance cron service
    const attendanceCronService = AttendanceCronService.getInstance();
    await attendanceCronService.initialize(userId);
  }

  // Method to cleanup when user logs out
  async cleanup(): Promise<void> {
    try {
      const notificationService = NotificationClientService.getInstance();
      
      // Cancel all scheduled notifications
      await notificationService.cancelAllNotifications();
      
      // Clear badge
      await notificationService.clearBadge();
      
      // Clear stored push token
      await AsyncStorage.removeItem('expoPushToken');
      
      // Cleanup attendance cron service
      const attendanceCronService = AttendanceCronService.getInstance();
      await attendanceCronService.cleanup();
      
      this.isInitialized = false;
      console.log('Notification system cleaned up');
    } catch (error) {
      console.error('Failed to cleanup notification system:', error);
    }
  }

  // Method to update push token when it becomes available
  async updatePushTokenForUser(userId: string): Promise<void> {
    try {
      const notificationService = NotificationClientService.getInstance();
      const firebaseNotificationService = NotificationBackendService.getInstance();
      
      const pushToken = notificationService.getExpoPushToken();
      if (pushToken) {
        const settings = await firebaseNotificationService.getUserNotificationSettings(userId);
        if (settings && pushToken !== settings.expoPushToken) {
          await firebaseNotificationService.updateUserPushToken(userId, pushToken);
          console.log('Push token updated for user:', userId);
        }
      }
    } catch (error) {
      console.error('Failed to update push token:', error);
    }
  }

  // Utility method to test notifications
  async testNotification(): Promise<void> {
    try {
      const notificationService = NotificationClientService.getInstance();
      
      const testTemplate = {
        id: 'test',
        title: '🧪 Test Notification',
        body: 'This is a test notification from BunkSafe!',
        data: { type: 'test' },
        priority: 'default' as const,
      };

      await notificationService.scheduleLocalNotification(testTemplate);
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }
}