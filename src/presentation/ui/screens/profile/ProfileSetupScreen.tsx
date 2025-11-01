import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { CustomButton } from '../../components/CustomButton';

interface ProfileSetupData {
  avatar?: string;
  whatsappNotifications: boolean;
  emailNotifications: boolean;
  attendanceReminders: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

interface ProfileSetupScreenProps {
  onNext: (data: ProfileSetupData) => void;
  onBack: () => void;
}

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({
  onNext,
  onBack,
}) => {
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('friends');

  const handleAvatarUpload = () => {
    // For demo purposes, we'll just show an alert
    // In real implementation, you would use ImagePicker
    Alert.alert(
      'Upload Avatar',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => {
          console.log('Camera selected');
          setAvatar('demo_avatar_camera');
        }},
        { text: 'Gallery', onPress: () => {
          console.log('Gallery selected');
          setAvatar('demo_avatar_gallery');
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNext = () => {
    onNext({
      avatar,
      whatsappNotifications,
      emailNotifications,
      attendanceReminders,
      profileVisibility,
    });
  };

  const ToggleSwitch: React.FC<{
    value: boolean;
    onToggle: (value: boolean) => void;
  }> = ({ value, onToggle }) => (
    <TouchableOpacity
      onPress={() => onToggle(!value)}
      className={`w-12 h-6 rounded-full p-1 ${
        value ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <View
        className={`w-4 h-4 rounded-full bg-white transform ${
          value ? 'translate-x-6' : 'translate-x-0'
        } transition-transform duration-200`}
      />
    </TouchableOpacity>
  );

  const VisibilityOption: React.FC<{
    title: string;
    description: string;
    value: 'public' | 'friends' | 'private';
    icon: string;
    selected: boolean;
    onSelect: () => void;
  }> = ({ title, description, value, icon, selected, onSelect }) => (
    <TouchableOpacity
      onPress={onSelect}
      className={`p-4 rounded-xl border-2 mb-3 ${
        selected 
          ? 'border-green-500 bg-green-50' 
          : 'border-gray-200 bg-white'
      }`}
    >
      <View className="flex-row items-center">
        <Text className="text-2xl mr-3">{icon}</Text>
        <View className="flex-1">
          <Text className={`font-semibold text-base ${
            selected ? 'text-green-700' : 'text-gray-800'
          }`}>
            {title}
          </Text>
          <Text className={`text-sm ${
            selected ? 'text-green-600' : 'text-gray-600'
          }`}>
            {description}
          </Text>
        </View>
        <View className={`w-5 h-5 rounded-full border-2 ${
          selected 
            ? 'border-green-500 bg-green-500' 
            : 'border-gray-300'
        }`}>
          {selected && (
            <View className="flex-1 items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-16 pb-8 px-6">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={onBack} className="mr-4">
              <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
                <Text className="text-lg">←</Text>
              </View>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-3xl font-bold text-gray-800">
                Profile Setup
              </Text>
              <Text className="text-lg text-gray-600 mt-2">
                Customize your profile and preferences
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Indicator */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center">
            <View className="flex-1 h-2 bg-green-500 rounded-full" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-green-500 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
            <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2" />
          </View>
          <Text className="text-sm text-gray-500 mt-2 text-center">Step 4 of 6</Text>
        </View>

        {/* Content */}
        <View className="px-6">
          {/* Avatar Upload */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Profile Picture
            </Text>
            <View className="items-center mb-6">
              <TouchableOpacity
                onPress={handleAvatarUpload}
                className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center border-2 border-dashed border-gray-400"
              >
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-full h-full rounded-full" />
                ) : (
                  <View className="items-center">
                    <Text className="text-3xl mb-1">📷</Text>
                    <Text className="text-xs text-gray-600">Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text className="text-sm text-gray-600 text-center mt-3">
                Upload a profile picture to help others recognize you
              </Text>
            </View>
          </View>

          {/* Notification Preferences */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Notification Preferences
            </Text>
            
            <View className="space-y-4">
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">WhatsApp Notifications</Text>
                  <Text className="text-sm text-gray-600">Get important updates via WhatsApp</Text>
                </View>
                <ToggleSwitch
                  value={whatsappNotifications}
                  onToggle={setWhatsappNotifications}
                />
              </View>
              
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">Email Notifications</Text>
                  <Text className="text-sm text-gray-600">Receive weekly summaries and alerts</Text>
                </View>
                <ToggleSwitch
                  value={emailNotifications}
                  onToggle={setEmailNotifications}
                />
              </View>
              
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">Attendance Reminders</Text>
                  <Text className="text-sm text-gray-600">Get reminded before your classes</Text>
                </View>
                <ToggleSwitch
                  value={attendanceReminders}
                  onToggle={setAttendanceReminders}
                />
              </View>
            </View>
          </View>

          {/* Profile Visibility */}
          <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
            <Text className="text-xl font-semibold text-gray-800 mb-4">
              Profile Visibility
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Choose who can see your profile and attendance information
            </Text>
            
            <VisibilityOption
              title="Public"
              description="Anyone can see your profile"
              value="public"
              icon="🌍"
              selected={profileVisibility === 'public'}
              onSelect={() => setProfileVisibility('public')}
            />
            
            <VisibilityOption
              title="Friends Only"
              description="Only your connections can see your profile"
              value="friends"
              icon="👥"
              selected={profileVisibility === 'friends'}
              onSelect={() => setProfileVisibility('friends')}
            />
            
            <VisibilityOption
              title="Private"
              description="Only you can see your profile information"
              value="private"
              icon="🔒"
              selected={profileVisibility === 'private'}
              onSelect={() => setProfileVisibility('private')}
            />
          </View>

          <View className="bg-green-50 p-4 rounded-xl mb-6 border border-green-200">
            <Text className="text-green-800 text-sm font-medium">
              ✨ You can change these settings anytime in your profile
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-100">
        <CustomButton
          title="Continue"
          onPress={handleNext}
        />
      </View>
    </View>
  );
};
