import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { InteractionManager, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { User } from '../../../../domain/model/User';
import { useFriends } from '../../../hooks/useFriends';
import { FriendsSkeleton } from '../../components/skeletons/FriendsSkeleton';

interface FriendsScreenProps {
  user?: User;
  onNavigateToChat?: (contactId: string, contactName: string, contactAvatar: string) => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = React.memo(({ user, onNavigateToChat }) => {
  const currentUser = user;

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const {
    classmates,
    classmatesLoading,
    error,
    loadClassmates,
  } = useFriends(
    currentUser?.id || null,
    currentUser?.name || currentUser?.nickname || 'User',
    '👤' // Default avatar since User model doesn't have avatar
  );

  // Load classmates on component mount (only once and only if no cached data)
  useEffect(() => {
    if (currentUser?.id && !hasLoadedRef.current && classmates.length === 0) {
      hasLoadedRef.current = true;
      console.log('🔄 FriendsScreen: Loading classmates for user:', currentUser.id);
      
      // Defer loading to not block UI
      InteractionManager.runAfterInteractions(() => {
        loadClassmates().catch((error) => {
          console.error('❌ FriendsScreen: Failed to load classmates:', error);
          hasLoadedRef.current = false; // Allow retry on error
        });
      });
    }
  }, [currentUser?.id, loadClassmates, classmates.length]);

  const handleMessageClassmate = (classmate: any) => {
    console.log('Opening chat with:', classmate.name);
    if (onNavigateToChat) {
      onNavigateToChat(classmate.userId, classmate.name, classmate.avatar);
    }
  };

  const handleViewClassmateProfile = (classmate: any) => {
    console.log('Viewing profile of:', classmate.name);
    // TODO: Navigate to profile screen
    // navigation.navigate('Profile', { userId: classmate.userId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'studying': return '#f59e0b';
      case 'offline': return '#6b7280';
      case 'away': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return 'radio-button-on';
      case 'studying': return 'book';
      case 'offline': return 'radio-button-off';
      case 'away': return 'time';
      default: return 'radio-button-off';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Gold': return '#f59e0b';
      case 'Silver': return '#6b7280';
      case 'Bronze': return '#cd7c2f';
      case 'Platinum': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const formatNextSession = (nextSession?: Date) => {
    if (!nextSession) return 'No session scheduled';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(nextSession.getFullYear(), nextSession.getMonth(), nextSession.getDate());

    const diffInDays = Math.floor((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const timeString = nextSession.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (diffInDays === 0) return `Today, ${timeString}`;
    if (diffInDays === 1) return `Tomorrow, ${timeString}`;
    if (diffInDays < 7) return `${nextSession.toLocaleDateString([], { weekday: 'long' })}, ${timeString}`;

    return nextSession.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Show message if no user is provided
  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: '#fafafa' }}>
        <Text className="text-gray-600 text-center">Please log in to view friends</Text>
      </View>
    );
  }

  // Show skeleton only on initial load with no data
  const showSkeleton = classmatesLoading && classmates.length === 0;

  if (showSkeleton) {
    return <FriendsSkeleton />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-6">

          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Classmates
            </Text>
            <Text className="text-gray-600">
              Message with people in your classes
            </Text>
          </View>

          {/* Classmates Section */}
          <View className="mb-2">
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-700">
                  {classmates.length} Classmate{classmates.length !== 1 ? 's' : ''}
                  <Text className="text-sm text-green-600 font-normal">
                    {' '}• {classmates.filter(c => c.isOnline).length} online
                  </Text>
                </Text>
                {classmatesLoading && (
                  <SkeletonLoader width={20} height={20} borderRadius={10} />
                )}
              </View>

              {classmates.length === 0 ? (
                <View className="py-8 items-center">
                  <Text className="text-gray-500 text-center">
                    No classmates found. Make sure you're in a classroom!
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {classmates.map((classmate) => (
                    <View
                      key={classmate.id}
                      className="bg-white rounded-2xl p-4 border border-gray-100 mb-1"
                    >
                      <View className="flex-row items-center">
                        <View className="relative mr-4">
                          <Text className="text-3xl">{classmate.avatar}</Text>
                          
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Text className="text-lg font-bold text-gray-800 mr-2">
                              {classmate.name}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row space-x-2">
                          <TouchableOpacity
                            className="bg-green-500 px-3 py-2 rounded-xl m-1"
                            onPress={() => handleMessageClassmate(classmate)}
                          >
                            <Ionicons name="chatbubble" size={16} color="#ffffff" />
                          </TouchableOpacity>
                         
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <Text className="text-red-800 text-center">{error}</Text>
            </View>
          )}

          {/* Bottom Padding */}
          <View className="h-2" />
        </View>
      </ScrollView>
    </View>
  );
});

FriendsScreen.displayName = 'FriendsScreen';