import React, { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationSettingsProps {
  userId: string;
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  userId,
  onClose,
}) => {
  const {
    permissionStatus,
    settings,
    isLoading,
    requestPermissions,
    updateSettings,
    scheduleDailyReminder,
    cancelAllNotifications,
  } = useNotifications(userId);

  const [reminderTime, setReminderTime] = useState({
    hour: settings?.reminderHour ?? 9,
    minute: settings?.reminderMinute ?? 0,
  });

  const handlePermissionRequest = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive task reminders.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleReminderTimeChange = async () => {
    try {
      await scheduleDailyReminder(reminderTime.hour, reminderTime.minute);
      Alert.alert('Success', 'Daily reminder time updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder time');
    }
  };

  const handleCancelAllNotifications = async () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert('Success', 'All notifications cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel notifications');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-gray-600">Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Notification Settings
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

        {/* Permission Status */}
        <View className="mb-6 p-4 bg-gray-50 rounded-lg">
          <Text className="text-lg font-semibold mb-2">Permission Status</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-700">
              Notifications {permissionStatus.granted ? 'Enabled' : 'Disabled'}
            </Text>
            {!permissionStatus.granted && (
              <TouchableOpacity
                onPress={handlePermissionRequest}
                className="px-4 py-2 bg-blue-500 rounded-lg"
              >
                <Text className="text-white font-semibold">Enable</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notification Types */}
        {settings && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-4">Notification Types</Text>
            
            <View className="space-y-4">
              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <View>
                  <Text className="font-medium text-gray-900">Task Created</Text>
                  <Text className="text-sm text-gray-600">
                    Get notified when you create a new task
                  </Text>
                </View>
                <Switch
                  value={settings.taskCreated}
                  onValueChange={(value) => handleSettingChange('taskCreated', value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings.taskCreated ? '#ffffff' : '#f3f4f6'}
                />
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <View>
                  <Text className="font-medium text-gray-900">Task Completed</Text>
                  <Text className="text-sm text-gray-600">
                    Get notified when you complete a task
                  </Text>
                </View>
                <Switch
                  value={settings.taskCompleted}
                  onValueChange={(value) => handleSettingChange('taskCompleted', value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings.taskCompleted ? '#ffffff' : '#f3f4f6'}
                />
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <View>
                  <Text className="font-medium text-gray-900">Deadline Reminders</Text>
                  <Text className="text-sm text-gray-600">
                    Get reminded before task deadlines
                  </Text>
                </View>
                <Switch
                  value={settings.deadlineReminders}
                  onValueChange={(value) => handleSettingChange('deadlineReminders', value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings.deadlineReminders ? '#ffffff' : '#f3f4f6'}
                />
              </View>

              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <View>
                  <Text className="font-medium text-gray-900">Daily Reminders</Text>
                  <Text className="text-sm text-gray-600">
                    Daily summary of your pending tasks
                  </Text>
                </View>
                <Switch
                  value={settings.dailyReminders}
                  onValueChange={(value) => handleSettingChange('dailyReminders', value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings.dailyReminders ? '#ffffff' : '#f3f4f6'}
                />
              </View>

              <View className="flex-row justify-between items-center py-3">
                <View>
                  <Text className="font-medium text-gray-900">Weekly Reports</Text>
                  <Text className="text-sm text-gray-600">
                    Weekly summary of completed and pending tasks
                  </Text>
                </View>
                <Switch
                  value={settings.weeklyReports}
                  onValueChange={(value) => handleSettingChange('weeklyReports', value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings.weeklyReports ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>
          </View>
        )}

        {/* Daily Reminder Time */}
        {settings?.dailyReminders && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-4">Daily Reminder Time</Text>
            <View className="p-4 bg-gray-50 rounded-lg">
              <Text className="text-gray-700 mb-2">
                Current time: {reminderTime.hour.toString().padStart(2, '0')}:
                {reminderTime.minute.toString().padStart(2, '0')}
              </Text>
              <TouchableOpacity
                onPress={handleReminderTimeChange}
                className="px-4 py-2 bg-blue-500 rounded-lg self-start"
              >
                <Text className="text-white font-semibold">Update Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold mb-4">Actions</Text>
          <TouchableOpacity
            onPress={handleCancelAllNotifications}
            className="px-4 py-3 bg-red-500 rounded-lg"
          >
            <Text className="text-white font-semibold text-center">
              Cancel All Scheduled Notifications
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="p-4 bg-blue-50 rounded-lg">
          <Text className="text-blue-800 font-semibold mb-2">ℹ️ About Notifications</Text>
          <Text className="text-blue-700 text-sm leading-5">
            • Task creation notifications are sent immediately when you create a task{'\n'}
            • Deadline reminders are scheduled 24 hours before the due date{'\n'}
            • Daily reminders are sent at your chosen time each day{'\n'}
            • All notifications respect your device's Do Not Disturb settings
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};