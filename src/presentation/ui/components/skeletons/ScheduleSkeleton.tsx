import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const ScheduleSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-gray-50">
      {/* Week Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <SkeletonLoader width={180} height={20} />
          <SkeletonLoader width={60} height={32} borderRadius={8} />
        </View>
        <View className="flex-row">
          <View className="w-16" />
          {[1, 2, 3, 4, 5, 6].map((day) => (
            <View key={day} className="flex-1 items-center py-2">
              <SkeletonLoader width={30} height={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={25} height={18} style={{ marginBottom: 4 }} />
              <View className="flex-row">
                <SkeletonLoader width={8} height={8} borderRadius={4} style={{ marginRight: 2 }} />
                <SkeletonLoader width={8} height={8} borderRadius={4} style={{ marginRight: 2 }} />
                <SkeletonLoader width={8} height={8} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Overview */}
      <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
        <SkeletonLoader width={120} height={18} style={{ marginBottom: 12 }} />
        <View className="flex-row justify-between">
          {[1, 2, 3, 4].map((stat) => (
            <View key={stat} className="items-center">
              <SkeletonLoader width={30} height={24} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={50} height={12} />
            </View>
          ))}
        </View>
      </View>

      {/* Schedule Grid */}
      <View className="flex-1 mt-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((timeSlot) => (
          <View key={timeSlot} className="flex-row border-b border-gray-100">
            <View className="w-16 p-2 bg-gray-50 border-r border-gray-200 justify-center">
              <SkeletonLoader width={40} height={12} />
            </View>
            {[1, 2, 3, 4, 5, 6].map((day) => (
              <View key={day} className="flex-1 min-h-16 border-r border-gray-100 p-1">
                {Math.random() > 0.6 && (
                  <View className="bg-gray-100 rounded-lg p-2 m-1">
                    <SkeletonLoader width="80%" height={12} style={{ marginBottom: 2 }} />
                    <SkeletonLoader width="60%" height={10} />
                  </View>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};