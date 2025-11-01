import React, { useEffect } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { AppNotificationInitializer } from '../../../core/services/AppNotificationInitializer';
import { AttendanceCronService } from '../../../core/services/AttendanceCronService';

interface AttendanceReminderIntegrationProps {
  userId: string;
  onSettingsPress?: () => void;
}

/**
 * Integration component that shows how to use the attendance reminder system
 * in your main app. This component handles initialization and provides
 * quick access to settings and test functionality.
 */
export const AttendanceReminderIntegration: React.FC<AttendanceReminderIntegrationProps> = ({
  userId,
  onSettingsPress,
}) => {
  const attendanceCronService = AttendanceCronService.getInstance();
  const notificationInitializer = AppNotificationInitializer.getInstance();

  useEffect(() => {
    // Initialize the attendance reminder system when component mounts
    const initializeAttendanceReminders = async () => {
      try {
        // Initialize the main notification system first
        await notificationInitializer.initialize(userId);
        
        // The attendance cron service is automatically initialized
        // as part of the main notification system initialization
        console.log('Attendance reminder system initialized for user:', userId);
      } catch (error) {
        console.error('Failed to initialize attendance reminders:', error);
      }
    };

    if (userId) {
      initializeAttendanceReminders();
    }

    // Cleanup when component unmounts or user changes
    return () => {
      if (userId) {
        attendanceCronService.cleanup().catch(console.error);
      }
    };
  }, [userId]);

  const handleQuickTest = async () => {
    try {
      await attendanceCronService.sendTestAttendanceReminder(userId);
      Alert.alert(
        'Test Sent! 🎉',
        'Check your notifications for a hilarious attendance reminder with Indian humor! 😄'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleMorningTest = async () => {
    try {
      await attendanceCronService.sendTestMorningMessage(userId);
      Alert.alert(
        'Good Morning! 🌅',
        'Check your notifications for a motivational morning message! ☀️'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send morning message');
    }
  };

  return (
    <View className="bg-white rounded-lg p-4 m-4 shadow-sm">
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">📚</Text>
        <Text className="text-lg font-semibold text-gray-800">
          Attendance Reminders
        </Text>
      </View>
      
      <Text className="text-gray-600 mb-4">
        Get daily reminders with Indian humor to mark your attendance!
      </Text>

      <View className="space-y-3">
        {/* Settings Button */}
        <TouchableOpacity
          onPress={onSettingsPress}
          className="bg-blue-500 rounded-lg p-3 flex-row items-center justify-center"
        >
          <Text className="text-2xl mr-2">⚙️</Text>
          <Text className="text-white font-semibold">
            Reminder Settings
          </Text>
        </TouchableOpacity>

        {/* Quick Test Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={handleQuickTest}
            className="flex-1 bg-green-500 rounded-lg p-3 flex-row items-center justify-center"
          >
            <Text className="text-xl mr-1">🎭</Text>
            <Text className="text-white font-medium text-sm">
              Test Reminder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleMorningTest}
            className="flex-1 bg-yellow-500 rounded-lg p-3 flex-row items-center justify-center"
          >
            <Text className="text-xl mr-1">🌅</Text>
            <Text className="text-white font-medium text-sm">
              Test Morning
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Schedule Info */}
      <View className="bg-gray-50 rounded-lg p-3 mt-4">
        <Text className="font-semibold text-gray-800 mb-2">
          📅 Daily Schedule
        </Text>
        <View className="space-y-1">
          <Text className="text-sm text-gray-600">
            🌅 Morning: Random time 7-9 AM
          </Text>
          <Text className="text-sm text-gray-600">
            🕗 Evening: 8:00 PM reminder
          </Text>
          <Text className="text-sm text-gray-600">
            🚨 Urgent: 9:30 PM final reminder
          </Text>
        </View>
      </View>

      {/* Fun Stats */}
      <View className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mt-3">
        <Text className="text-center text-sm text-gray-700">
          <Text className="font-semibold">45+ unique messages</Text> with Indian humor! 🇮🇳
        </Text>
      </View>
    </View>
  );
};

// Example usage in your main app:
/*
import { AttendanceReminderIntegration } from './AttendanceReminderIntegration';
import { AttendanceReminderSettingsComponent } from './AttendanceReminderSettings';

function MainApp({ userId }) {
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <AttendanceReminderSettingsComponent 
        userId={userId}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <View>
      <AttendanceReminderIntegration
        userId={userId}
        onSettingsPress={() => setShowSettings(true)}
      />
    </View>
  );
}
*/