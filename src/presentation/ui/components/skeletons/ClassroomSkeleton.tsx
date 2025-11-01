import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const ClassroomSkeleton: React.FC = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <View className="px-6 pt-16 py-6">
        {/* Classroom Overview Skeleton */}
        <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <SkeletonLoader width={180} height={24} />
          </View>
          
          <SkeletonLoader width={120} height={36} borderRadius={8} style={{ marginBottom: 16 }} />

          {/* Classroom List Skeleton */}
          <View className="space-y-4">
            {[1, 2].map((item) => (
              <View key={item} className="bg-white rounded-2xl p-5 border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <SkeletonLoader width={48} height={48} borderRadius={24} style={{ marginRight: 16 }} />
                    <View className="flex-1">
                      <SkeletonLoader width={140} height={18} style={{ marginBottom: 4 }} />
                      <SkeletonLoader width={200} height={14} style={{ marginBottom: 8 }} />
                      <SkeletonLoader width={80} height={20} borderRadius={10} />
                    </View>
                  </View>
                  <View className="items-end ml-3">
                    <View className="bg-gray-100 px-3 py-2 rounded-xl mb-2">
                      <SkeletonLoader width={20} height={16} style={{ marginBottom: 2 }} />
                      <SkeletonLoader width={40} height={12} />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Performance Chart Skeleton */}
        <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
          <SkeletonLoader width={160} height={24} style={{ marginBottom: 16 }} />
          <View className="h-48 mb-4">
            <View className="flex-row items-end justify-between h-full px-2">
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <View key={item} className="items-center flex-1">
                  <SkeletonLoader 
                    width={24} 
                    height={Math.random() * 100 + 50} 
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                  />
                  <SkeletonLoader width={20} height={12} />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Grid Skeleton */}
        <View className="mb-6">
          <SkeletonLoader width={120} height={24} style={{ marginBottom: 16 }} />
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3, 4].map((item) => (
              <View key={item} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ width: '47%' }}>
                <View className="flex-row items-center justify-between mb-3">
                  <SkeletonLoader width={24} height={24} borderRadius={12} />
                  <SkeletonLoader width={40} height={16} />
                </View>
                <SkeletonLoader width={50} height={32} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={80} height={14} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};