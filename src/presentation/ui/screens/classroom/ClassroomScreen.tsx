import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useClassroomAnalytics } from '../../../hooks/useClassroomAnalytics';
import { WeeklyScheduleCalendar } from '../../components/WeeklyScheduleCalendar';
import { ClassroomSkeleton } from '../../components/skeletons';

const { width } = Dimensions.get('window');

interface ClassroomScreenProps {
  userId: string;
}

export const ClassroomScreen: React.FC<ClassroomScreenProps> = ({ userId }) => {
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const { analytics, loading, error, refreshing, refresh } = useClassroomAnalytics(userId);

  // Show loading state
  if (loading) {
    return <ClassroomSkeleton />;
  }

  // Show error state
  if (error || !analytics) {
    return (
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: '#fafafa' }}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          Unable to Load Analytics
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error || 'Failed to load classroom analytics'}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          className="bg-green-500 px-6 py-3 rounded-lg mt-6"
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View className="px-6 pt-16 py-6">
          {/* Classroom Overview */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                📚 Classroom Overview
              </Text>

            </View>
            <TouchableOpacity
              onPress={() => setShowWeeklySchedule(true)}
              className="bg-green-500 px-2 items-center py-2 rounded-lg m-2"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar-outline" size={16} color="white" />
                <Text className="text-white font-medium ml-2">View Schedule</Text>
              </View>
            </TouchableOpacity>

            {/* Classroom List */}
            <View className="space-y-4">
              {analytics.classroomOverview && analytics.classroomOverview.length > 0 ? (
                analytics.classroomOverview.map((classroom, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-2xl mr-4 items-center justify-center"
                          style={{ backgroundColor: `${classroom.color || '#3b82f6'}20` }}
                        >
                          <View
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: classroom.color || '#3b82f6' }}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-800 mb-1">{classroom.name}</Text>
                          <Text className="text-sm text-gray-600 leading-5">{classroom.description || 'No description available'}</Text>
                          {classroom.code && (
                            <TouchableOpacity
                              className="bg-gray-100 self-start px-3 py-1 rounded-full mt-2 flex-row items-center"
                              activeOpacity={0.7}
                              onPress={() => {
                                if (classroom.code) {
                                  Clipboard.setStringAsync(classroom.code);
                                }
                              }}
                            >
                              <Text className="text-xs font-medium text-gray-700 mr-1">Code: {classroom.code}</Text>
                              <Ionicons name="copy-outline" size={12} color="#374151" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View className="items-end ml-3">
                        <View className="bg-green-50 px-3 py-2 rounded-xl mb-2">
                          <Text className="text-sm font-bold text-green-700">{classroom.studentCount}</Text>
                          <Text className="text-xs text-green-600">students</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="bg-white rounded-2xl p-8 border border-gray-100 items-center">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="school-outline" size={32} color="#9ca3af" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-800 mb-2">No Classrooms Yet</Text>
                  <Text className="text-gray-500 text-center text-sm leading-5">
                    Join or create your first classroom to get started with analytics
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Weekly Performance Chart */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                📈 Weekly Performance
              </Text>

            </View>
            <View className="h-48 mb-4">
              <View className="flex-row items-end justify-between h-full px-2">
                {analytics.weeklyPerformance.map((item, index) => (
                  <View key={index} className="items-center flex-1">
                    <View
                      className="bg-green-500 rounded-t-lg mb-2"
                      style={{
                        height: `${Math.max(item.value, 5)}%`,
                        width: 24,
                      }}
                    />
                    <Text className="text-xs text-gray-600 font-medium">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>



          {/* Stats Grid */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              📋 This Week
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {analytics.weeklyStats.map((stat, index) => (
                <View key={index} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ width: (width - 56) / 2 }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Ionicons name={stat.icon as any} size={24} color="#6b7280" />
                    <Text className={`text-sm font-semibold ${stat.color}`}>
                      {stat.change}
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Weekly Schedule Calendar */}
      <WeeklyScheduleCalendar
        visible={showWeeklySchedule}
        onClose={() => setShowWeeklySchedule(false)}
        userId={userId}
      />
    </View>
  );
};
