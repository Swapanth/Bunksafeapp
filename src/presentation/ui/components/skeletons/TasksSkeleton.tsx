import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const TasksSkeleton: React.FC = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <View className="px-6 pt-16 pb-6">
        {/* Header Skeleton */}
        <SkeletonLoader width={120} height={32} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={200} height={16} style={{ marginBottom: 24 }} />

        {/* Quick Stats Skeleton */}
        <View className="flex-row justify-between mb-6">
          {[1, 2, 3].map((item) => (
            <View key={item} className="bg-white rounded-2xl p-4 border border-gray-100" style={{ width: '30%' }}>
              <SkeletonLoader width={24} height={24} borderRadius={12} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={30} height={24} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={50} height={14} />
            </View>
          ))}
        </View>

        {/* Add Task Button Skeleton */}
        <SkeletonLoader width="100%" height={48} borderRadius={12} style={{ marginBottom: 24 }} />

        {/* Tasks List Skeleton */}
        <View className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <SkeletonLoader width={20} height={20} borderRadius={10} style={{ marginRight: 12 }} />
                    <SkeletonLoader width={150} height={18} />
                  </View>
                  <SkeletonLoader width="90%" height={14} style={{ marginBottom: 8, marginLeft: 32 }} />
                  <View className="flex-row items-center ml-8">
                    <SkeletonLoader width={80} height={20} borderRadius={10} style={{ marginRight: 8 }} />
                    <SkeletonLoader width={60} height={20} borderRadius={10} />
                  </View>
                </View>
                <SkeletonLoader width={24} height={24} borderRadius={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};