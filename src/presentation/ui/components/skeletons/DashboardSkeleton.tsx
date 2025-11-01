import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const DashboardSkeleton: React.FC = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      {/* Header Skeleton */}
      <View className="px-6 pt-16 pb-6 border-b border-gray-100">
        <SkeletonLoader width={200} height={32} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={150} height={24} animated={false} />
      </View>

      {/* Stats Cards Skeleton */}
      <View className="px-6 py-6">
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <View className="flex-row items-center">
            <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
            <View className="flex-1">
              <SkeletonLoader width={120} height={24} style={{ marginBottom: 4 }} animated={false} />
              <SkeletonLoader width={80} height={16} animated={false} />
            </View>
          </View>
        </View>

        <View className="flex-row space-x-4">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <SkeletonLoader width={24} height={24} borderRadius={12} animated={false} />
              <SkeletonLoader width={40} height={28} />
            </View>
            <SkeletonLoader width={60} height={14} animated={false} />
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center justify-between mb-2">
              <SkeletonLoader width={24} height={24} borderRadius={12} animated={false} />
              <SkeletonLoader width={40} height={28} />
            </View>
            <SkeletonLoader width={80} height={14} animated={false} />
          </View>
        </View>
      </View>

      {/* Today's Classes Skeleton */}
      <View className="bg-white rounded-3xl p-6 border border-gray-100 mx-5 mb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <SkeletonLoader width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} animated={false} />
            <SkeletonLoader width={140} height={20} animated={false} />
          </View>
        </View>

        <View className="space-y-3">
          {[1, 2, 3].map((item) => (
            <View key={item} className="flex-row items-center p-4 rounded-2xl border border-gray-100">
              <SkeletonLoader width={16} height={16} borderRadius={8} style={{ marginRight: 16 }} animated={false} />
              <View className="flex-1">
                <SkeletonLoader width={120} height={16} style={{ marginBottom: 4 }} animated={item === 1} />
                <SkeletonLoader width={80} height={14} animated={false} />
              </View>
              <View className="flex-row space-x-2">
                <SkeletonLoader width={32} height={32} borderRadius={8} animated={false} />
                <SkeletonLoader width={32} height={32} borderRadius={8} animated={false} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Attendance Summary Skeleton */}
      <View className="bg-white rounded-3xl p-6 border border-gray-100 mx-5">
        <SkeletonLoader width={160} height={20} style={{ marginBottom: 12 }} animated={false} />
        <View className="flex-row justify-between">
          {[1, 2, 3].map((item) => (
            <View key={item} className="flex-1 items-center">
              <SkeletonLoader width={40} height={32} style={{ marginBottom: 4 }} animated={false} />
              <SkeletonLoader width={60} height={14} animated={false} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};