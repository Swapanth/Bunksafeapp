import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EditProfileModal } from '../../components/EditProfileModal';
import { ProfileSkeleton } from '../../components/skeletons/ProfileSkeleton';
import { AppInfo, ProfileDataService, SettingsSection as SettingsSectionType, ToggleSetting, useProfileData, UserProfile } from './useProfileData';

interface ProfileScreenProps {
  service?: ProfileDataService;
  onLogout?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  service,
  onLogout,
  onNavigate,
}) => {
  const {
    user,
    toggleSettings,
    settingSections,
    appInfo,
    loading,
    error,
    updateProfile,
  } = useProfileData(service);

  const [showEditModal, setShowEditModal] = useState(false);

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: '#fafafa' }}>
        <Text className="text-red-600 text-center mb-4">Error loading profile</Text>
        <Text className="text-gray-600 text-center">{error}</Text>
      </View>
    );
  }

  // Loading state - show skeleton only if no user data yet
  if (loading && !user) {
    return <ProfileSkeleton />;
  }

  // If we don't have user data after loading, show a placeholder
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: '#fafafa' }}>
        <Text className="text-gray-600 text-center">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 py-6">
          {/* Profile Card */}
          <ProfileCard
            user={user}
            onEditProfile={() => setShowEditModal(true)}
          />

          {/* Quick Toggle Settings
          {toggleSettings.length > 0 && (
            <QuickSettingsCard toggleSettings={toggleSettings} />
          )} */}

          {/* Settings Sections */}
          {settingSections.map((section) => (
            <SettingsSection
              key={section.id}
              section={section}
              onNavigate={onNavigate}
              onEditProfile={() => setShowEditModal(true)}
            />
          ))}

          {/* Logout Button */}
          {onLogout && <LogoutButton onLogout={onLogout} />}

          {/* App Version */}
          <AppVersionInfo appInfo={appInfo} />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          visible={showEditModal}
          user={user}
          onClose={() => setShowEditModal(false)}
          onSave={updateProfile}
        />
      )}
    </View>
  );
};

// Enhanced Profile Card Component with edit functionality
const ProfileCard: React.FC<{
  user: UserProfile;
  onEditProfile?: () => void;
}> = ({ user, onEditProfile }) => (
  <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
    <View className="flex-row items-center mb-4">
      {/* <TouchableOpacity onPress={onEditProfile}>
        <Text className="text-5xl mr-4">{user.avatar}</Text>
      </TouchableOpacity> */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-xl font-bold text-gray-800 mr-2">
            {user.name}
          </Text>
          <View className="bg-yellow-100 px-2 py-1 rounded-full">
            <Text className="text-yellow-700 text-xs font-semibold">
              {user.level}
            </Text>
          </View>
        </View>
        <Text className="text-gray-600 mb-2">{user.email}</Text>
        <Text className="text-gray-500 text-sm">
          Member since {user.joinDate}
        </Text>
      </View>
      {onEditProfile && (
        <TouchableOpacity onPress={onEditProfile} className="p-2">
          <Ionicons name="pencil-outline" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>

    {/* <View className="flex-row justify-between pt-4 border-t border-gray-100">
      <View className="items-center flex-1">
        <Text className="text-2xl font-bold text-orange-600">
          🔥 {user.studyStreak}
        </Text>
        <Text className="text-gray-600 text-sm">Day Streak</Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-2xl font-bold text-blue-600">{user.stats.level}</Text>
        <Text className="text-gray-600 text-sm">Level</Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-2xl font-bold text-green-600">{user.stats.progress}</Text>
        <Text className="text-gray-600 text-sm">Progress</Text>
      </View>
    </View> */}
  </View>
);

// Quick Settings Card Component
const QuickSettingsCard: React.FC<{ toggleSettings: ToggleSetting[] }> = ({ toggleSettings }) => (
  <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
    <Text className="text-xl font-bold text-gray-800 mb-4">
      🔧 Quick Settings
    </Text>
    <View className="space-y-4">
      {toggleSettings.map((setting) => (
        <ToggleSettingItem key={setting.id} setting={setting} />
      ))}
    </View>
  </View>
);

// Toggle Setting Item Component with animation
const ToggleSettingItem: React.FC<{ setting: ToggleSetting }> = ({ setting }) => {
  const handleToggle = async () => {
    try {
      await setting.onChange(!setting.value);
    } catch (error) {
      console.error('Failed to toggle setting:', error);
    }
  };

  return (
    <View className="flex-row justify-between items-center m-2">
      <View className="flex-row items-center flex-1">
        <Ionicons name={setting.icon as any} size={24} color="#6b7280" />
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-gray-800">{setting.label}</Text>
          <Text className="text-gray-600 text-sm">{setting.description}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleToggle}
        className={`w-12 h-6 rounded-full p-1 ${setting.value ? 'bg-green-500' : 'bg-gray-300'}`}
        activeOpacity={0.8}
        style={{
          backgroundColor: setting.value ? '#10b981' : '#d1d5db',
        }}
      >
        <View
          className="bg-white w-4 h-4 rounded-full"
          style={{
            transform: [{ translateX: setting.value ? 20 : 0 }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 1,
          }}
        />
      </TouchableOpacity>
    </View>
  );
};

const SettingsSection: React.FC<{
  section: SettingsSectionType;
  onNavigate?: (screen: string, params?: any) => void;
  onEditProfile?: () => void;
}> = ({ section, onNavigate, onEditProfile }) => (
  <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
    <Text className="text-xl font-bold text-gray-800 mb-4">
      {section.title}
    </Text>
    <View className="space-y-4">
      {section.items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          onNavigate={onNavigate}
          onEditProfile={onEditProfile}
        />
      ))}
    </View>
  </View>
);

// Enhanced Menu Item Component
const MenuItem: React.FC<{
  item: { id: string; icon: string; label: string; action: () => void };
  onNavigate?: (screen: string, params?: any) => void;
  onEditProfile?: () => void;
}> = ({ item, onNavigate, onEditProfile }) => (
  <TouchableOpacity
    className="flex-row items-center justify-between m-2 p-2 rounded-xl active:bg-gray-50"
    onPress={() => {
      item.action();
      // Handle specific actions
      if (item.id === 'editProfile') {
        onEditProfile?.();
      } else if (item.id === 'changePassword') {
        onNavigate?.('ChangePassword');
      } else if (item.id === 'language') {
        onNavigate?.('LanguageSettings');
      } else if (item.id === 'privacy') {
        onNavigate?.('PrivacySettings');
      } else if (item.id === 'studyGoals') {
        onNavigate?.('StudyGoals');
      } else if (item.id === 'subjects') {
        onNavigate?.('ManageSubjects');
      } else if (item.id === 'help') {
        onNavigate?.('HelpCenter');
      } else if (item.id === 'feedback') {
        onNavigate?.('SendFeedback');
      } else if (item.id === 'about') {
        onNavigate?.('AboutApp');
      }
    }}
    activeOpacity={0.7}
  >
    <View className="flex-row items-center flex-1">
      <Ionicons name={item.icon as any} size={24} color="#6b7280" />
      <Text className="font-semibold text-gray-800 ml-3">
        {item.label}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
  </TouchableOpacity>
);

// Enhanced Logout Button Component
const LogoutButton: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <TouchableOpacity
    className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 active:bg-red-100"
    onPress={onLogout}
    activeOpacity={0.8}
  >
    <View className="flex-row items-center justify-center">
      <Ionicons name="log-out-outline" size={24} color="#ef4444" />
      <Text className="text-red-600 font-semibold ml-2 text-lg">
        Sign Out
      </Text>
    </View>
  </TouchableOpacity>
);

// App Version Info Component
const AppVersionInfo: React.FC<{ appInfo: AppInfo }> = ({ appInfo }) => (
  <View className="items-center pb-6">
    {/* <Text className="text-gray-500 text-sm font-medium">
      BunkSafe Mobile {appInfo.version}
    </Text>
    <Text className="text-gray-400 text-xs mt-1">
      {appInfo.tagline}
    </Text>
     */}
    {/* Divider */}
    {/* <View className="w-16 h-px bg-gray-300 my-4" /> */}
    
    {/* Developer Info Card */}
    <View className="bg-white rounded-2xl px-6 py-4 border border-gray-100 mt-2" 
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}>
      <Text className="text-gray-400 text-xs text-center mb-2">
        Built with ❤️ for students
      </Text>
      <View className="flex-row items-center justify-center mt-1">
        <Text className="text-gray-600 text-xs font-medium ml-1">
          Swapanth Vakapalli
        </Text>
      </View>
      <View className="flex-row items-center justify-center mt-1">
        <Ionicons name="mail-outline" size={12} color="#9ca3af" />
        <Text className="text-gray-500 text-xs ml-1">
          swapanthvakapalli@gmail.com
        </Text>
      </View>
    </View>
  </View>
);