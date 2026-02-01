import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { NotificationTemplate, TaskNotificationData } from '../../core/constants/NotificationTemplates';

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sent: boolean;
  sentAt?: Date;
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserNotificationSettings {
  userId: string;
  expoPushToken?: string;
  taskCreated: boolean;
  taskCompleted: boolean;
  deadlineReminders: boolean;
  dailyReminders: boolean;
  weeklyReports: boolean;
  messageNotifications: boolean;
  reminderHour: number;
  reminderMinute: number;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationBackendService {
  private static instance: NotificationBackendService;

  private constructor() {}

  static getInstance(): NotificationBackendService {
    if (!NotificationBackendService.instance) {
      NotificationBackendService.instance = new NotificationBackendService();
    }
    return NotificationBackendService.instance;
  }

  // User notification settings management
  async saveUserNotificationSettings(settings: Partial<UserNotificationSettings>): Promise<void> {
    try {
      const settingsRef = doc(db, 'userNotificationSettings', settings.userId!);
      const now = new Date();
      
      const settingsData: Partial<UserNotificationSettings> = {
        userId: settings.userId!,
        taskCreated: settings.taskCreated ?? true,
        taskCompleted: settings.taskCompleted ?? true,
        deadlineReminders: settings.deadlineReminders ?? true,
        dailyReminders: settings.dailyReminders ?? true,
        messageNotifications: settings.messageNotifications ?? true,
        weeklyReports: settings.weeklyReports ?? true,
        reminderHour: settings.reminderHour ?? 9,
        reminderMinute: settings.reminderMinute ?? 0,
        createdAt: settings.createdAt ?? now,
        updatedAt: now,
      };

      // Only include expoPushToken if it's defined (not null or undefined)
      if (settings.expoPushToken !== null && settings.expoPushToken !== undefined) {
        settingsData.expoPushToken = settings.expoPushToken;
      }

      await setDoc(settingsRef, settingsData, { merge: true });
      console.log('User notification settings saved');
    } catch (error) {
      console.error('Failed to save user notification settings:', error);
      throw error;
    }
  }

  async getUserNotificationSettings(userId: string): Promise<UserNotificationSettings | null> {
    try {
      console.log('🔥 Getting notification settings for user:', userId);
      
      if (!userId || userId.trim() === '') {
        console.error('❌ Invalid userId provided for notification settings:', userId);
        return null;
      }
      
      const settingsRef = doc(db, 'userNotificationSettings', userId);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        console.log('✅ Found notification settings for user:', userId);
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as UserNotificationSettings;
      }
      
      console.log('⚠️ No notification settings found for user:', userId);
      return null;
    } catch (error) {
      console.error('Failed to get user notification settings:', error);
      throw error;
    }
  }

  async updateUserPushToken(userId: string, expoPushToken: string): Promise<void> {
    try {
      const settingsRef = doc(db, 'userNotificationSettings', userId);
      await updateDoc(settingsRef, {
        expoPushToken,
        updatedAt: new Date(),
      });
      console.log('User push token updated');
    } catch (error) {
      console.error('Failed to update user push token:', error);
      throw error;
    }
  }

  // Notification record management
  async saveNotificationRecord(
    userId: string,
    template: NotificationTemplate,
    scheduledFor?: Date
  ): Promise<string> {
    try {
      // Generate a unique notification ID
      const notificationId = `${userId}_${template.id}_${Date.now()}`;
      const notificationRef = doc(db, 'notifications', notificationId);
      
      const notificationRecord: any = {
        id: notificationId,
        userId,
        type: template.id,
        title: template.title,
        body: template.body,
        sent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only add optional fields if they're defined
      if (template.data) {
        notificationRecord.data = template.data;
      }
      if (scheduledFor) {
        notificationRecord.scheduledFor = scheduledFor;
      }

      await setDoc(notificationRef, notificationRecord);
      console.log('Notification record saved:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('Failed to save notification record:', error);
      throw error;
    }
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        sent: true,
        sentAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Notification marked as sent:', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as sent:', error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    limitCount: number = 50
  ): Promise<NotificationRecord[]> {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount) // directly limit in the query instead of slicing later
      );
  
      const querySnapshot = await getDocs(q);
      const notifications: NotificationRecord[] = [];
  
      querySnapshot.forEach((doc) => {
        const data = doc.data();
  
        const notification: NotificationRecord = {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as NotificationRecord;
  
        // Only add optional date fields if they exist
        if (data.sentAt) {
          notification.sentAt = data.sentAt.toDate();
        }
        if (data.scheduledFor) {
          notification.scheduledFor = data.scheduledFor.toDate();
        }
  
        notifications.push(notification);
      });
  
      return notifications;
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      throw error;
    }
  }
  

  // Message notification trigger
  async triggerMessageNotification(
    recipientUserId: string,
    senderName: string,
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      console.log('🔔 Triggering message notification for:', recipientUserId);
      
      const settings = await this.getUserNotificationSettings(recipientUserId);
      
      if (!settings) {
        console.log('⚠️ No settings found for user, creating defaults with message notifications enabled');
        // Create default settings if they don't exist
        await this.saveUserNotificationSettings({
          userId: recipientUserId,
          messageNotifications: true,
          taskCreated: true,
          taskCompleted: true,
          deadlineReminders: true,
          dailyReminders: true,
          weeklyReports: true,
          reminderHour: 9,
          reminderMinute: 0,
        });
        // Re-fetch settings
        const newSettings = await this.getUserNotificationSettings(recipientUserId);
        if (!newSettings?.expoPushToken) {
          console.log('⚠️ No push token found for user after creating settings');
          return;
        }
      }
      
      // Check if user has message notifications enabled (default true if not set)
      const messageNotificationsEnabled = settings?.messageNotifications ?? true;
      console.log('📱 Message notifications enabled:', messageNotificationsEnabled);
      
      if (!messageNotificationsEnabled) {
        console.log('🔕 Message notifications disabled for user:', recipientUserId);
        return;
      }

      // Check if user has a push token
      if (!settings?.expoPushToken) {
        console.log('⚠️ No push token found for user:', recipientUserId);
        return;
      }

      console.log('✅ Push token found:', settings.expoPushToken.substring(0, 20) + '...');

      // Create notification template
      const template = {
        id: 'new_message',
        title: senderName,
        body: messageContent.length > 100 ? messageContent.substring(0, 97) + '...' : messageContent,
        data: {
          type: 'new_message',
          conversationId: conversationId,
          senderId: senderName,
        },
      };

      console.log('📤 Sending push notification:', template.title, '-', template.body);

      // Try to save notification record
      try {
        await this.saveNotificationRecord(recipientUserId, template);
      } catch (saveError) {
        console.warn('Could not save notification record, but continuing:', saveError);
      }

      // Skip push notification on web platform (CORS restriction)
      if (typeof window !== 'undefined' && window.location) {
        console.log('ℹ️ Skipping push notification on web platform (use native app for push notifications)');
        return;
      }

      // Send push notification (only works on native apps or from backend)
      await this.sendPushNotificationToUser(settings.expoPushToken, template);
      console.log('✅ Message notification sent successfully to:', recipientUserId);
    } catch (error) {
      console.error('❌ Failed to trigger message notification:', error);
      // Don't throw to prevent breaking message sending flow
    }
  }

  // Task-specific notification triggers
  async triggerTaskCreatedNotification(
    userId: string,
    taskData: TaskNotificationData
  ): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId);
      
      if (!settings?.taskCreated) {
        console.log('Task created notifications disabled for user:', userId);
        return;
      }

      // Save notification record for tracking
      const template = {
        id: 'task_created',
        title: '📝 New Task Created',
        body: `"${taskData.taskTitle}" has been added to your ${taskData.subject} tasks`,
        data: {
          type: 'task_created',
          taskId: taskData.taskId,
          subject: taskData.subject,
          priority: taskData.priority,
        },
      };

      // Try to save notification record, but don't fail if it doesn't work
      try {
        await this.saveNotificationRecord(userId, template);
      } catch (saveError) {
        console.warn('Could not save notification record, but continuing:', saveError);
      }

      // If user has push token, send push notification
      if (settings.expoPushToken) {
        await this.sendPushNotificationToUser(settings.expoPushToken, template);
      }
    } catch (error) {
      console.error('Failed to trigger task created notification:', error);
      // Don't throw the error to prevent breaking the task creation flow
    }
  }

  async triggerTaskCompletedNotification(
    userId: string,
    taskData: TaskNotificationData
  ): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId);
      
      if (!settings?.taskCompleted) {
        console.log('Task completed notifications disabled for user:', userId);
        return;
      }

      const template = {
        id: 'task_completed',
        title: '✅ Task Completed',
        body: `Great job! You've completed "${taskData.taskTitle}"`,
        data: {
          type: 'task_completed',
          taskId: taskData.taskId,
          subject: taskData.subject,
        },
      };

      // Try to save notification record, but don't fail if it doesn't work
      try {
        await this.saveNotificationRecord(userId, template);
      } catch (saveError) {
        console.warn('Could not save notification record, but continuing:', saveError);
      }

      if (settings.expoPushToken) {
        await this.sendPushNotificationToUser(settings.expoPushToken, template);
      }
    } catch (error) {
      console.error('Failed to trigger task completed notification:', error);
      // Don't throw the error to prevent breaking the task completion flow
    }
  }

  async scheduleDeadlineReminder(
    userId: string,
    taskData: TaskNotificationData,
    reminderDate: Date
  ): Promise<void> {
    try {
      const settings = await this.getUserNotificationSettings(userId);
      
      if (!settings?.deadlineReminders) {
        console.log('Deadline reminders disabled for user:', userId);
        return;
      }

      const template = {
        id: 'task_deadline_approaching',
        title: '⏰ Task Deadline Approaching',
        body: `"${taskData.taskTitle}" is due soon! Don't forget to complete it.`,
        data: {
          type: 'task_deadline_approaching',
          taskId: taskData.taskId,
          subject: taskData.subject,
          dueDate: taskData.dueDate,
        },
      };

      await this.saveNotificationRecord(userId, template, reminderDate);
      console.log('Deadline reminder scheduled for:', reminderDate);
    } catch (error) {
      console.error('Failed to schedule deadline reminder:', error);
    }
  }

  // Push notification sender
  private async sendPushNotificationToUser(
    expoPushToken: string,
    template: NotificationTemplate
  ): Promise<void> {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: template.title,
      body: template.body,
      data: template.data,
      priority: template.priority || 'default',
    };

    try {
      console.log('📤 Sending push to Expo:', { 
        to: expoPushToken.substring(0, 20) + '...', 
        title: template.title,
        body: template.body.substring(0, 50) + '...'
      });
      
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Push notification sent successfully:', result);
      } else {
        console.error('❌ Push notification failed:', result);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
      throw error;
    }
  }

  // Batch operations for multiple users
  async sendBulkNotifications(
    userTokens: Array<{ userId: string; expoPushToken: string }>,
    template: NotificationTemplate
  ): Promise<void> {
    const messages = userTokens.map(({ expoPushToken }) => ({
      to: expoPushToken,
      sound: 'default',
      title: template.title,
      body: template.body,
      data: template.data,
      priority: template.priority || 'default',
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      console.log('Bulk notifications sent:', result);
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate))
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      
      await Promise.all(deletePromises);
      console.log(`Cleaned up ${deletePromises.length} old notifications`);
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error);
    }
  }
}