import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { Platform } from "react-native";
import {
    NotificationTemplate,
    NotificationTemplates,
    TaskNotificationData,
} from "../../core/constants/NotificationTemplates";

// Conditionally import and configure notifications (not available in Expo Go)
let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
  // Configure notification behavior
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (error) {
  // Silently ignore - notifications not available in Expo Go
}

export class NotificationClientService {
  private static instance: NotificationClientService;
  private expoPushToken: string | null = null;
  private onPushTokenReceived?: (token: string) => void;

  private constructor() {}

  static getInstance(): NotificationClientService {
    if (!NotificationClientService.instance) {
      NotificationClientService.instance = new NotificationClientService();
    }
    return NotificationClientService.instance;
  }

  // Check if Notifications API is available
  private isNotificationsAvailable(): boolean {
    return Notifications !== null;
  }

  // Initialize notification service
  async initialize(): Promise<void> {
    if (!this.isNotificationsAvailable()) {
      console.warn('Notifications not available - skipping initialization');
      return;
    }
    
    try {
      // Try to load existing push token from storage
      const storedToken = await AsyncStorage.getItem("expoPushToken");
      if (storedToken) {
        this.expoPushToken = storedToken;
        console.log("Loaded existing push token from storage");
      }

      await this.registerForPushNotifications();
      await this.setupNotificationChannels();
      this.setupNotificationListeners();
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
    }
  }

  // Register for push notifications and get Expo push token
  async registerForPushNotifications(): Promise<string | null> {
    if (!this.isNotificationsAvailable()) {
      console.warn('Notifications not available');
      return null;
    }
    
    if (!Device.isDevice) {
      console.warn("Push notifications only work on physical devices");
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Push notification permission not granted");
        return null;
      }

      // Check if we're in Expo Go (which doesn't support push notifications in SDK 53+)
      const isExpoGo = __DEV__ && !Device.isDevice;

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: "1a118060-a766-48bf-8dcd-d70b88fbfb32", // Bunksafe EAS project ID
        });

        this.expoPushToken = token.data;
        await AsyncStorage.setItem("expoPushToken", token.data);

        console.log("✅ Expo push token obtained:", token.data);

        // Notify that push token is now available
        this.onPushTokenReceived?.(token.data);

        return token.data;
      } catch (tokenError) {
        // This will happen in Expo Go with SDK 53+
        console.warn(
          "⚠️ Push notifications not available in Expo Go (SDK 53+). Use development build for full functionality."
        );
        console.warn("Local notifications will still work.");
        console.error("Token error details:", tokenError);
        return null;
      }
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  }

  // Setup notification channels for Android
  private async setupNotificationChannels(): Promise<void> {    if (!this.isNotificationsAvailable()) {
      return;
    }
        if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("task-notifications", {
        name: "Task Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Task Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#4A90E2",
        sound: "default",
        enableVibrate: true,
      });
    }
  }

  // Setup notification event listeners
  private setupNotificationListeners(): void {
    if (!this.isNotificationsAvailable()) return;
    
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification: any) => {
      console.log("Notification received:", notification);
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log("Notification response:", response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle notification tap/response
  private handleNotificationResponse(
    response: any
  ): void {
    const data = response.notification.request.content.data;

    switch (data?.type) {
      case "task_created":
      case "task_deadline_approaching":
      case "task_overdue":
        // Navigate to task details
        console.log("Navigate to task:", data.taskId);
        break;
      case "daily_task_reminder":
        // Navigate to tasks list
        console.log("Navigate to tasks list");
        break;
      case "new_message":
        // Navigate to chat conversation
        console.log("Navigate to conversation:", data.conversationId);
        break;
      default:
        console.log("Unknown notification type:", data?.type);
    }
  }

  // Schedule local notification using template
  async scheduleLocalNotification(
    template: NotificationTemplate,
    trigger?: any
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: template.title,
          body: template.body,
          data: template.data,
          sound: template.sound || "default",
          badge: template.badge,
          priority:
            template.priority === "high"
              ? Notifications.AndroidNotificationPriority.HIGH
              : Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: trigger || null,
      });

      console.log("Local notification scheduled:", notificationId);
      return notificationId;
    } catch (error) {
      console.error("Failed to schedule local notification:", error);
      throw error;
    }
  }

  // Send push notification (for server-side use)
  async sendPushNotification(
    expoPushToken: string,
    template: NotificationTemplate
  ): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: template.sound || "default",
      title: template.title,
      body: template.body,
      data: template.data,
      badge: template.badge,
      priority: template.priority,
    };

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      console.log("Push notification sent:", result);
    } catch (error) {
      console.error("Failed to send push notification:", error);
      throw error;
    }
  }

  // Task-specific notification methods
  async notifyTaskCreated(taskData: TaskNotificationData): Promise<void> {
    const template = NotificationTemplates.TASK_CREATED(taskData);
    await this.scheduleLocalNotification(template);
  }

  async notifyTaskCompleted(taskData: TaskNotificationData): Promise<void> {
    const template = NotificationTemplates.TASK_COMPLETED(taskData);
    await this.scheduleLocalNotification(template);
  }

  async scheduleDeadlineReminder(
    taskData: TaskNotificationData,
    reminderDate: Date
  ): Promise<string> {
    if (!this.isNotificationsAvailable()) return '';
    
    const template = NotificationTemplates.TASK_DEADLINE_APPROACHING(taskData);
    const trigger: any = {
      date: reminderDate,
      type: Notifications.SchedulableTriggerInputTypes.DATE,
    };

    return await this.scheduleLocalNotification(template, trigger);
  }

  async scheduleDailyReminder(
    hour: number = 9,
    minute: number = 0
  ): Promise<string> {
    if (!this.isNotificationsAvailable()) return '';
    
    const template = NotificationTemplates.DAILY_TASK_REMINDER(0); // Will be updated with actual count
    const trigger: any = {
      hour,
      minute,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    };

    return await this.scheduleLocalNotification(template, trigger);
  }

  // Utility methods
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<any[]> {
    if (!this.isNotificationsAvailable()) return [];
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Get current push token
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Set callback for when push token becomes available
  setPushTokenCallback(callback: (token: string) => void): void {
    this.onPushTokenReceived = callback;
  }

  // Save push token to user profile (to be called after user authentication)
  async savePushTokenToUser(userId: string): Promise<void> {
    if (!this.expoPushToken) {
      console.warn("No push token available to save");
      return;
    }

    try {
      // This would typically save to your backend/Firebase
      await AsyncStorage.setItem(`pushToken_${userId}`, this.expoPushToken);
      console.log("Push token saved for user:", userId);
    } catch (error) {
      console.error("Failed to save push token:", error);
    }
  }
}
