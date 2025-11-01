import React, { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AttendanceCronService, AttendanceReminderSettings } from '../../../core/services/AttendanceCronService';

interface AttendanceReminderSettingsProps {
  userId: string;
}

export const AttendanceReminderSettingsComponent: React.FC<AttendanceReminderSettingsProps> = ({
  userId,
}) => {
  const [settings, setSettings] = useState<AttendanceReminderSettings>({
    userId,
    attendanceReminders: true,
    morningMessages: true,
    eveningReminderTime: { hour: 20, minute: 0 },
    secondReminderTime: { hour: 21, minute: 30 },
    morningMessageTime: { hour: 8, minute: 0 },
  });
  const [loading, setLoading] = useState(false);

  const attendanceCronService = AttendanceCronService.getInstance();

  const handleToggleAttendanceReminders = async (value: boolean) => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, attendanceReminders: value };
      await attendanceCronService.updateAttendanceSettings(userId, updatedSettings);
      setSettings(updatedSettings);
      
      Alert.alert(
        'Settings Updated',
        value 
          ? 'Attendance reminders enabled! You\'ll get funny reminders at 8:00 PM and 9:30 PM daily.' 
          : 'Attendance reminders disabled.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update attendance reminder settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMorningMessages = async (value: boolean) => {
    setLoading(true);
    try {
      const updatedSettings = { ...settings, morningMessages: value };
      await attendanceCronService.updateAttendanceSettings(userId, updatedSettings);
      setSettings(updatedSettings);
      
      Alert.alert(
        'Settings Updated',
        value 
          ? 'Morning motivation messages enabled! Get ready for daily dose of humor and motivation.' 
          : 'Morning messages disabled.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update morning message settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAttendanceReminder = async () => {
    try {
      await attendanceCronService.sendTestAttendanceReminder(userId);
      Alert.alert('Test Sent!', 'Check your notifications for a sample attendance reminder with Indian humor! 😄');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleTestMorningMessage = async () => {
    try {
      await attendanceCronService.sendTestMorningMessage(userId);
      Alert.alert('Test Sent!', 'Check your notifications for a sample morning motivation message! 🌅');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-6 mb-4 shadow-sm">
        <Text className="text-2xl font-bold text-gray-800 mb-2">
          📚 Attendance Reminders
        </Text>
        <Text className="text-gray-600 mb-6">
          Get hilarious Indian-style reminders to mark your attendance daily!
        </Text>

        {/* Attendance Reminders Toggle */}
        <View className="flex-row items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              🎭 Daily Attendance Reminders
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Get funny reminders at 8:00 PM and 9:30 PM to mark attendance
            </Text>
          </View>
          <Switch
            value={settings.attendanceReminders}
            onValueChange={handleToggleAttendanceReminders}
            disabled={loading}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={settings.attendanceReminders ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        {/* Morning Messages Toggle */}
        <View className="flex-row items-center justify-between mb-6 p-4 bg-yellow-50 rounded-lg">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">
              🌅 Morning Motivation Messages
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Start your day with funny and motivational messages (7-9 AM)
            </Text>
          </View>
          <Switch
            value={settings.morningMessages}
            onValueChange={handleToggleMorningMessages}
            disabled={loading}
            trackColor={{ false: '#d1d5db', true: '#f59e0b' }}
            thumbColor={settings.morningMessages ? '#ffffff' : '#f3f4f6'}
          />
        </View>

        {/* Schedule Info */}
        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            📅 Notification Schedule
          </Text>
          
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🌅</Text>
              <Text className="text-gray-700">
                Morning Messages: Random time between 7:00-9:00 AM
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🕗</Text>
              <Text className="text-gray-700">
                First Reminder: 8:00 PM daily
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Text className="text-2xl mr-3">🕘</Text>
              <Text className="text-gray-700">
                Second Reminder: 9:30 PM daily (if not marked)
              </Text>
            </View>
          </View>
        </View>

        {/* Test Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleTestAttendanceReminder}
            className="bg-blue-500 rounded-lg p-4 flex-row items-center justify-center"
            disabled={loading}
          >
            <Text className="text-2xl mr-2">🧪</Text>
            <Text className="text-white font-semibold text-lg">
              Test Attendance Reminder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTestMorningMessage}
            className="bg-yellow-500 rounded-lg p-4 flex-row items-center justify-center"
            disabled={loading}
          >
            <Text className="text-2xl mr-2">☀️</Text>
            <Text className="text-white font-semibold text-lg">
              Test Morning Message
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fun Facts */}
        <View className="bg-green-50 rounded-lg p-4 mt-6">
          <Text className="text-lg font-semibold text-green-800 mb-2">
            🎉 Fun Features
          </Text>
          <View className="space-y-1">
            <Text className="text-green-700">• 20+ unique morning messages</Text>
            <Text className="text-green-700">• 15+ hilarious attendance reminders</Text>
            <Text className="text-green-700">• 10+ urgent second reminders</Text>
            <Text className="text-green-700">• All with Indian trending humor!</Text>
            <Text className="text-green-700">• Random message selection daily</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View className="bg-orange-50 rounded-lg p-4 mt-4">
          <Text className="text-sm text-orange-800">
            <Text className="font-semibold">Note:</Text> These notifications work best in development builds. 
            For full functionality including push notifications, create a development build using{' '}
            <Text className="font-mono">npx expo run:android</Text> or{' '}
            <Text className="font-mono">npx expo run:ios</Text>
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};