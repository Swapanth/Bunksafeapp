import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const FriendsSkeleton: React.FC = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <View className="px-6 pt-16 pb-6">
        {/* Header */}
        <SkeletonLoader width={100} height={32} style={{ marginBottom: 8 }} />
        <SkeletonLoader width={180} height={16} style={{ marginBottom: 24 }} />

        {/* Search Bar */}
        <SkeletonLoader width="100%" height={48} borderRadius={12} style={{ marginBottom: 24 }} />

        {/* Friends List */}
        <View className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <View key={item} className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center">
                <SkeletonLoader width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />
                <View className="flex-1">
                  <SkeletonLoader width={120} height={18} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={80} height={14} />
                </View>
                <SkeletonLoader width={32} height={32} borderRadius={8} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};