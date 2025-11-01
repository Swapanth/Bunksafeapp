import * as Device from 'expo-device';
import React, { useEffect, useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '../../hooks/useNotifications';

interface NotificationStatusProps {
  userId?: string;
  showDetails?: boolean;
}

export const NotificationStatus: React.FC<NotificationStatusProps> = ({
  userId,
  showDetails = true,
}) => {
  const [isExpoGo, setIsExpoGo] = useState(false);
  const { permissionStatus, expoPushToken, isLoading } = useNotifications(userId);

  useEffect(() => {
    // Detect if running in Expo Go
    const checkExpoGo = async () => {
      try {
        // In Expo Go, this will be true, in development builds it will be false
        const isInExpoGo = __DEV__ && !Device.isDevice;
        setIsExpoGo(isInExpoGo);
      } catch (error) {
        console.log('Could not determine Expo Go status');
      }
    };

    checkExpoGo();
  }, []);

  const openDevelopmentBuildDocs = () => {
    Linking.openURL('https://docs.expo.dev/develop/development-builds/introduction/');
  };

  if (isLoading) {
    return (
      <View className="p-3 bg-gray-50 rounded-lg">
        <Text className="text-gray-600">Checking notification status...</Text>
      </View>
    );
  }

  // Show warning if in Expo Go
  if (isExpoGo) {
    return (
      <View className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <View className="flex-row items-center mb-2">
          <Text className="text-xl mr-2">⚠️</Text>
          <Text className="text-yellow-800 font-semibold">Limited Functionality</Text>
        </View>
        <Text className="text-yellow-700 mb-3">
          Push notifications don't work in Expo Go (SDK 53+). Local notifications will work for testing UI.
        </Text>
        <TouchableOpacity
          onPress={openDevelopmentBuildDocs}
          className="px-3 py-2 bg-yellow-600 rounded-lg self-start"
        >
          <Text className="text-white font-semibold">Learn About Development Builds</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show status for development/production builds
  const hasPermission = permissionStatus.granted;
  const hasPushToken = !!expoPushToken;

  return (
    <View className="space-y-3">
      {/* Permission Status */}
      <View className={`p-3 rounded-lg ${hasPermission ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">{hasPermission ? '✅' : '❌'}</Text>
          <Text className={`font-semibold ${hasPermission ? 'text-green-800' : 'text-red-800'}`}>
            Notification Permission: {hasPermission ? 'Granted' : 'Denied'}
          </Text>
        </View>
        {!hasPermission && (
          <Text className="text-red-700 text-sm mt-1">
            Enable notifications in device settings to receive task reminders
          </Text>
        )}
      </View>

      {/* Push Token Status */}
      <View className={`p-3 rounded-lg ${hasPushToken ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">{hasPushToken ? '✅' : '⚠️'}</Text>
          <Text className={`font-semibold ${hasPushToken ? 'text-green-800' : 'text-orange-800'}`}>
            Push Notifications: {hasPushToken ? 'Available' : 'Unavailable'}
          </Text>
        </View>
        {!hasPushToken && (
          <Text className="text-orange-700 text-sm mt-1">
            Push notifications require a development build or production app
          </Text>
        )}
      </View>

      {/* Feature Availability */}
      {showDetails && (
        <View className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Text className="text-blue-800 font-semibold mb-2">Available Features:</Text>
          <View className="space-y-1">
            <Text className="text-blue-700 text-sm">✅ Local notifications (immediate)</Text>
            <Text className="text-blue-700 text-sm">✅ Scheduled notifications</Text>
            <Text className="text-blue-700 text-sm">✅ Notification settings</Text>
            <Text className="text-blue-700 text-sm">
              {hasPushToken ? '✅' : '❌'} Background push notifications
            </Text>
            <Text className="text-blue-700 text-sm">
              {hasPushToken ? '✅' : '❌'} Remote notification delivery
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};