import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { User } from '../../../../domain/model/User';
import { useFriends } from '../../../hooks/useFriends';
import { FriendsSkeleton } from '../../components/skeletons/FriendsSkeleton';
import { SkeletonLoader } from '../../components/skeletons/SkeletonLoader';

interface FriendsScreenProps {
  user?: User;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ user }) => {
  const currentUser = user;

  // Debug logging
  console.log('🔍 FriendsScreen: Received user:', currentUser);
  console.log('🔍 FriendsScreen: User ID:', currentUser?.id);
  console.log('🔍 FriendsScreen: User name:', currentUser?.name || currentUser?.nickname);

  const {
    friends,
    bestFriends,
    friendRequests,
    classmates,
    studyGroups,
    loading,
    classmatesLoading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    toggleBestFriend,
    loadClassmates,
    joinStudyGroup,
  } = useFriends(
    currentUser?.id || null,
    currentUser?.name || currentUser?.nickname || 'User',
    '👤' // Default avatar since User model doesn't have avatar
  );

  // Load classmates on component mount
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 FriendsScreen: Loading classmates for user:', currentUser.id);
      loadClassmates().catch((error) => {
        console.error('❌ FriendsScreen: Failed to load classmates:', error);
        // Don't show error to user for classmates loading failure
        // This is a non-critical feature
      });
    }
  }, [currentUser?.id, loadClassmates]);

  const handleRemoveFriend = (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleToggleBestFriend = async (friendId: string, currentStatus: boolean) => {
    try {
      await toggleBestFriend(friendId, !currentStatus);
    } catch (error) {
      Alert.alert('Error', 'Failed to update best friend status. Please try again.');
    }
  };

  const handleFriendActions = (friend: any) => {
    Alert.alert(
      friend.name,
      'Choose an action',
      [
        { text: 'View Profile', onPress: () => console.log('View Profile') },
        { text: 'Send Message', onPress: () => handleMessageFriend(friend) },
        {
          text: friend.isBestFriend ? 'Remove from Best Friends' : 'Add to Best Friends',
          onPress: () => handleToggleBestFriend(friend.id, friend.isBestFriend)
        },
        { text: 'Remove Friend', style: 'destructive', onPress: () => handleRemoveFriend(friend.id) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleSendFriendRequest = async (classmate: any) => {
    try {
      await sendFriendRequest({
        toUserId: classmate.userId,
        toUserName: classmate.name,
        toUserAvatar: classmate.avatar,
        message: `Hi ${classmate.name}! I'd like to connect with you.`,
      });
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request. Please try again.');
    }
  };

  const handleJoinStudyGroup = async (groupId: string) => {
    try {
      await joinStudyGroup(groupId);
      Alert.alert('Success', 'Joined study group!');
    } catch (error) {
      Alert.alert('Error', 'Failed to join study group. Please try again.');
    }
  };

  const handleMessageClassmate = (classmate: any) => {
    console.log('Opening chat with:', classmate.name);
    // In a real app, this would navigate to ChatScreen with the classmate's info
  };

  const handleMessageFriend = (friend: any) => {
    console.log('Opening chat with friend:', friend.name);
    // In a real app, this would navigate to ChatScreen with the friend's info
  };

  const handleViewClassmateProfile = (classmate: any) => {
    console.log('Viewing profile of:', classmate.name);
    // Navigate to profile screen
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

  if (loading) {
    return <FriendsSkeleton />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-6">

          {/* Friend Requests Section */}
          {friendRequests.length > 0 && (
            <View className="mb-6 bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                👋 Friend Requests ({friendRequests.length})
              </Text>
              <View className="space-y-3">
                {friendRequests.map((request) => (
                  <View key={request.id} className="bg-gray-50 rounded-2xl p-4">
                    <View className="flex-row items-center">
                      <Text className="text-3xl mr-4">{request.fromUserAvatar}</Text>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-800">
                          {request.fromUserName}
                        </Text>
                        {request.message && (
                          <Text className="text-gray-600 text-sm mt-1">
                            "{request.message}"
                          </Text>
                        )}
                        <Text className="text-gray-500 text-xs mt-1">
                          {formatLastSeen(request.createdAt)}
                        </Text>
                      </View>
                      <View className="flex-row space-x-2">
                        <TouchableOpacity
                          className="bg-green-500 px-4 py-2 rounded-xl"
                          onPress={() => handleAcceptFriendRequest(request.id)}
                        >
                          <Text className="text-white font-semibold text-sm">Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="bg-gray-300 px-4 py-2 rounded-xl"
                          onPress={() => handleDeclineFriendRequest(request.id)}
                        >
                          <Text className="text-gray-700 font-semibold text-sm">Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Best Friends Section */}
          {bestFriends.length > 0 && (
            <View className="mb-6 bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                ❤️ Best Friends
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <View className="flex-row space-x-4 px-2">
                  {bestFriends.map((friend) => (
                    <TouchableOpacity
                      key={friend.id}
                      className="bg-white rounded-2xl p-4 border border-gray-100 items-center ml-2"
                      style={{ width: 100 }}
                      activeOpacity={0.7}
                      onPress={() => handleFriendActions(friend)}
                    >
                      <View className="relative mb-1">
                        <Text className="text-3xl">{friend.avatar}</Text>
                        <View
                          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: getStatusColor(friend.status) }}
                        />
                      </View>
                      <Text className="text-sm font-semibold text-gray-800 text-center mb-1">
                        {friend.name.split(' ')[0]}
                      </Text>
                      <Text className="text-xs text-gray-600 text-center">
                        🔥 {friend.streak}
                      </Text>
                      <View
                        className="px-2 py-1 rounded-full mt-1"
                        style={{ backgroundColor: getLevelColor(friend.level) + '20' }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: getLevelColor(friend.level) }}
                        >
                          {friend.level}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Study Groups */}
          <View className="bg-white rounded-3xl p-6 border border-gray-100 mb-4">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              📚 Study Groups
            </Text>
            {studyGroups.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500 text-center">
                  No study groups yet. Join or create one to get started!
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {studyGroups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    className="p-4 border border-gray-100 rounded-2xl m-1"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="font-bold text-gray-800 mb-1">
                          {group.name}
                        </Text>
                        <Text className="text-gray-600 text-sm mb-2">
                          {group.subject}
                        </Text>
                        <View className="flex-row items-center">
                          <Ionicons name="people" size={14} color="#6b7280" />
                          <Text className="text-gray-600 text-sm ml-1 mr-4">
                            {group.members.length} members
                          </Text>
                          <Ionicons name="time" size={14} color="#6b7280" />
                          <Text className="text-gray-600 text-sm ml-1">
                            {formatNextSession(group.nextSession)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        className="px-4 py-2 rounded-xl"
                        style={{ backgroundColor: group.color }}
                        onPress={() => handleJoinStudyGroup(group.id)}
                      >
                        <Text className="text-white font-semibold text-sm">
                          View
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* All Friends Section */}
          {friends.length > 0 && (
            <View className="mb-6 bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-xl font-bold text-gray-800 mb-4">
                👥 All Friends ({friends.length})
              </Text>
              <View className="space-y-3">
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    className="bg-gray-50 rounded-2xl p-4"
                    onPress={() => handleFriendActions(friend)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <View className="relative mr-4">
                        <Text className="text-3xl">{friend.avatar}</Text>
                        <View
                          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: getStatusColor(friend.status) }}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-lg font-bold text-gray-800 mr-2">
                            {friend.name}
                          </Text>
                          {friend.isBestFriend && (
                            <Text className="text-red-500">❤️</Text>
                          )}
                        </View>
                        <View className="flex-row items-center mb-2">
                          <Ionicons
                            name={getStatusIcon(friend.status) as any}
                            size={14}
                            color={getStatusColor(friend.status)}
                          />
                          <Text className="text-gray-600 text-sm ml-1 mr-4">
                            {formatLastSeen(friend.lastSeen)}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            🔥 {friend.streak} streak
                          </Text>
                        </View>
                        {friend.commonSubjects.length > 0 && (
                          <View className="flex-row flex-wrap">
                            {friend.commonSubjects.slice(0, 3).map((subject, index) => (
                              <View key={index} className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                                <Text className="text-blue-800 text-xs">{subject}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: getLevelColor(friend.level) + '20' }}
                      >
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: getLevelColor(friend.level) }}
                        >
                          {friend.level}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Classmates Section */}
          <View className="mb-2">
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-700">
                  Classmates
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
                          <View
                            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white"
                            style={{ backgroundColor: getStatusColor(classmate.status) }}
                          />
                        </View>

                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Text className="text-lg font-bold text-gray-800 mr-2">
                              {classmate.name}
                            </Text>
                          </View>

                          <View className="flex-row items-center mb-2">
                            <Ionicons
                              name={getStatusIcon(classmate.status) as any}
                              size={14}
                              color={getStatusColor(classmate.status)}
                            />
                            <Text className="text-gray-600 text-sm ml-1 mr-4">
                              {formatLastSeen(classmate.lastSeen)}
                            </Text>
                            <Text className="text-gray-600 text-sm">
                              {classmate.year}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row space-x-2">
                          {classmate.isFriend ? (
                            <>
                              <TouchableOpacity
                                className="bg-green-500 px-3 py-2 rounded-xl m-1"
                                onPress={() => handleMessageClassmate(classmate)}
                              >
                                <Ionicons name="chatbubble" size={16} color="#ffffff" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="bg-gray-200 px-3 py-2 rounded-xl m-1"
                                onPress={() => handleViewClassmateProfile(classmate)}
                              >
                                <Ionicons name="person" size={16} color="#6b7280" />
                              </TouchableOpacity>
                            </>
                          ) : classmate.friendRequestSent ? (
                            <View className="bg-gray-200 px-4 py-2 rounded-xl m-1">
                              <Text className="text-gray-600 text-sm font-medium">Sent</Text>
                            </View>
                          ) : (
                            <>
                              <TouchableOpacity
                                className="bg-green-500 px-3 py-2 rounded-xl m-1"
                                onPress={() => handleSendFriendRequest(classmate)}
                              >
                                <Ionicons name="person-add" size={16} color="#ffffff" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                className="bg-green-500 px-3 py-2 rounded-xl m-1"
                                onPress={() => handleMessageClassmate(classmate)}
                              >
                                <Ionicons name="chatbubble" size={16} color="#ffffff" />
                              </TouchableOpacity>
                            </>
                          )}
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
};

FriendsScreen.displayName = 'FriendsScreen';