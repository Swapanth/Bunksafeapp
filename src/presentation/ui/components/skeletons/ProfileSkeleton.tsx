import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export const ProfileSkeleton: React.FC = () => {
  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <View className="px-6 pt-16 pb-6">
        {/* Profile Header */}
        <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
          <View className="items-center mb-6">
            <SkeletonLoader width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
            <SkeletonLoader width={150} height={24} style={{ marginBottom: 4 }} animated={false} />
            <SkeletonLoader width={120} height={16} animated={false} />
          </View>
          <SkeletonLoader width="100%" height={40} borderRadius={12} animated={false} />
        </View>

        {/* Settings Sections - Reduced animation load */}
        {[1, 2, 3].map((section) => (
          <View key={section} className="bg-white rounded-3xl p-6 mb-4 border border-gray-100">
            <SkeletonLoader width={120} height={20} style={{ marginBottom: 16 }} animated={section === 1} />
            <View className="space-y-3">
              {[1, 2, 3].map((item) => (
                <View key={item} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center flex-1">
                    <SkeletonLoader 
                      width={24} 
                      height={24} 
                      borderRadius={12} 
                      style={{ marginRight: 12 }} 
                      animated={false}
                    />
                    <View className="flex-1">
                      <SkeletonLoader 
                        width={100} 
                        height={16} 
                        style={{ marginBottom: 2 }} 
                        animated={false}
                      />
                      <SkeletonLoader width={150} height={12} animated={false} />
                    </View>
                  </View>
                  <SkeletonLoader width={40} height={20} borderRadius={10} animated={false} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};