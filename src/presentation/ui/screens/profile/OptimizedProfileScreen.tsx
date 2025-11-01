import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { EditProfileModal } from '../../components/EditProfileModal';
import { FastProfileSkeleton } from '../../components/skeletons/FastSkeleton';
import { useOptimizedProfileData } from './useOptimizedProfileData';
import { ProfileDataService } from './useProfileData';

interface OptimizedProfileScreenProps {
  service?: ProfileDataService;
  onLogout?: () => void;
  onNavigate?: (screen: string, params?: any) => void;
}

export const OptimizedProfileScreen: React.FC<OptimizedProfileScreenProps> = ({
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
    settingsLoading,
    error,
    updateProfile,
  } = useOptimizedProfileData(service);

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

  // Fast loading state - only show skeleton if user data is loading
  if (loading || !user) {
    return <FastProfileSkeleton />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 py-6">
          {/* Profile Card - Shows immediately when user data loads */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-3">
                <Text className="text-3xl">{user.avatar}</Text>
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-1">{user.name}</Text>
              <Text className="text-gray-600 text-base">{user.email}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              className="bg-blue-600 rounded-2xl p-4 active:bg-blue-700"
              activeOpacity={0.8}
            >
              <Text className="text-white text-center font-semibold text-base">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* User Stats - Shows immediately */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <Text className="text-lg font-bold text-gray-900 mb-4">Your Progress</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">{user.studyStreak}</Text>
                <Text className="text-gray-600 text-sm">Day Streak</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">{user.stats.progress}</Text>
                <Text className="text-gray-600 text-sm">Progress</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">{user.level}</Text>
                <Text className="text-gray-600 text-sm">Level</Text>
              </View>
            </View>
          </View>

          {/* Settings - Progressive loading */}
          {settingsLoading ? (
            <View className="bg-white rounded-3xl p-6 mb-4 border border-gray-100">
              <View className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
            </View>
          ) : (
            <>
              {/* Toggle Settings */}
              {toggleSettings.length > 0 && (
                <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
                  <Text className="text-lg font-bold text-gray-900 mb-4">Preferences</Text>
                  <View className="space-y-4">
                    {toggleSettings.map((setting) => (
                      <View key={setting.id} className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name={setting.icon as any} size={20} color="#6b7280" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-medium text-gray-900">{setting.label}</Text>
                            <Text className="text-sm text-gray-600">{setting.description}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => setting.onChange(!setting.value)}
                          className={`w-12 h-6 rounded-full ${
                            setting.value ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <View
                            className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                              setting.value ? 'translate-x-6' : 'translate-x-0.5'
                            }`}
                            style={{
                              transform: [{ translateX: setting.value ? 24 : 2 }],
                            }}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Settings Sections */}
              {settingSections.map((section) => (
                <View key={section.id} className="bg-white rounded-3xl p-6 mb-4 border border-gray-100">
                  <Text className="text-lg font-bold text-gray-900 mb-4">{section.title}</Text>
                  <View className="space-y-1">
                    {section.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={item.action}
                        className="flex-row items-center justify-between py-3 px-2 rounded-xl active:bg-gray-50"
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-center flex-1">
                          <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                            <Ionicons name={item.icon as any} size={16} color="#6b7280" />
                          </View>
                          <Text className="text-base text-gray-900 flex-1">{item.label}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            onPress={onLogout}
            className="bg-red-50 border border-red-200 rounded-3xl p-6 mb-6"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text className="text-red-600 font-semibold text-base ml-2">Sign Out</Text>
            </View>
          </TouchableOpacity>

          {/* App Info */}
          <View className="items-center py-6">
            <Text className="text-gray-500 text-sm">{appInfo.tagline}</Text>
            <Text className="text-gray-400 text-xs mt-1">{appInfo.version}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        onSave={updateProfile}
      />
    </View>
  );
};