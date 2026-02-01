import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NotificationTemplates, TaskNotificationData } from '../../../core/constants/NotificationTemplates';
import { AppNotificationInitializer } from '../../../core/services/AppNotificationInitializer';
import { NotificationClientService } from '../../../data/services/NotificationClientService';

interface NotificationTestPanelProps {
  userId: string;
  onClose?: () => void;
}

export const NotificationTestPanel: React.FC<NotificationTestPanelProps> = ({
  userId,
  onClose,
}) => {
  const notificationService = NotificationClientService.getInstance();
  const notificationInitializer = AppNotificationInitializer.getInstance();

  const testTaskData: TaskNotificationData = {
    taskId: 'test-task-123',
    taskTitle: 'Complete React Native Assignment',
    subject: 'Mobile Development',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    priority: 'High',
    userId,
  };

  const handleTestTaskCreated = async () => {
    try {
      await notificationService.notifyTaskCreated(testTaskData);
      Alert.alert('Success', 'Task created notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  const handleTestTaskCompleted = async () => {
    try {
      await notificationService.notifyTaskCompleted(testTaskData);
      Alert.alert('Success', 'Task completed notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  const handleTestDeadlineReminder = async () => {
    try {
      const reminderDate = new Date(Date.now() + 10 * 1000); // 10 seconds from now
      await notificationService.scheduleDeadlineReminder(testTaskData, reminderDate);
      Alert.alert('Success', 'Deadline reminder scheduled for 10 seconds from now!');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule reminder');
      console.error(error);
    }
  };

  const handleTestDailyReminder = async () => {
    try {
      const template = NotificationTemplates.DAILY_TASK_REMINDER(3);
      await notificationService.scheduleLocalNotification(template);
      Alert.alert('Success', 'Daily reminder notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  const handleTestGeneric = async () => {
    try {
      await notificationInitializer.testNotification();
      Alert.alert('Success', 'Generic test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  const handleClearBadge = async () => {
    try {
      await notificationService.clearBadge();
      Alert.alert('Success', 'Badge cleared!');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear badge');
      console.error(error);
    }
  };

  const handleGetScheduledNotifications = async () => {
    try {
      const notifications = await notificationService.getScheduledNotifications();
      Alert.alert(
        'Scheduled Notifications',
        `You have ${notifications.length} scheduled notifications`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get scheduled notifications');
      console.error(error);
    }
  };

  const handleCancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      Alert.alert('Success', 'All notifications cancelled!');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel notifications');
      console.error(error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-gray-900">
            🧪 Notification Test Panel
          </Text>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full bg-gray-100"
            >
              <Text className="text-gray-600 font-semibold">✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Status */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">System Status</Text>
          {/* <NotificationStatus userId={userId} showDetails={true} /> */}
          <Text className="text-gray-500">Status component temporarily unavailable</Text>
        </View>

        {/* Test Buttons */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">Test Notifications</Text>
          <View className="space-y-3">
        <TouchableOpacity
          onPress={handleTestTaskCreated}
          className="p-3 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            📝 Test Task Created Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTestTaskCompleted}
          className="p-3 bg-green-500 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            ✅ Test Task Completed Notification
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTestDeadlineReminder}
          className="p-3 bg-orange-500 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            ⏰ Test Deadline Reminder (10s delay)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTestDailyReminder}
          className="p-3 bg-purple-500 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            📋 Test Daily Reminder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleTestGeneric}
          className="p-3 bg-indigo-500 rounded-lg"
        >
          <Text className="text-white font-semibold text-center">
            🧪 Test Generic Notification
          </Text>
        </TouchableOpacity>

          </View>
        </View>

        {/* Utility Buttons */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-3">Utilities</Text>
          <View className="space-y-3">
          <TouchableOpacity
            onPress={handleGetScheduledNotifications}
            className="p-3 bg-gray-500 rounded-lg mb-2"
          >
            <Text className="text-white font-semibold text-center">
              📅 Check Scheduled Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearBadge}
            className="p-3 bg-yellow-500 rounded-lg mb-2"
          >
            <Text className="text-white font-semibold text-center">
              🔢 Clear Badge Count
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancelAllNotifications}
            className="p-3 bg-red-500 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              🚫 Cancel All Notifications
            </Text>
          </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View className="p-3 bg-blue-50 rounded-lg">
          <Text className="text-blue-800 font-semibold mb-1">ℹ️ Test Info</Text>
          <Text className="text-blue-700 text-sm">
            • Local notifications work in all environments{'\n'}
            • Push notifications require development build (not Expo Go){'\n'}
            • Make sure notifications are enabled for this app{'\n'}
            • Some tests schedule notifications for future delivery{'\n'}
            • Check your notification center to see results
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};