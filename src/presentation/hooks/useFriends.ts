import { useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
import {
    Classmate,
    CreateFriendRequestData,
    CreateStudyGroupData,
    Friend,
    FriendRequest,
    StudyGroup,
    UpdateFriendData
} from '../../domain/model/Friend';
import { FriendUseCase } from '../../domain/usecase/FriendUseCase';
import { dataCache } from '../utils/DataCache';

export interface UseFriendsReturn {
  // Friends
  friends: Friend[];
  bestFriends: Friend[];
  
  // Friend Requests
  friendRequests: FriendRequest[];
  
  // Classmates
  classmates: Classmate[];
  
  // Study Groups
  studyGroups: StudyGroup[];
  
  // Loading states
  loading: boolean;
  classmatesLoading: boolean;
  error: string | null;
  
  // Actions
  sendFriendRequest: (requestData: CreateFriendRequestData) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  updateFriend: (friendId: string, updates: UpdateFriendData) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  toggleBestFriend: (friendId: string, isBestFriend: boolean) => Promise<void>;
  loadClassmates: (classroomId?: string) => Promise<void>;
  createStudyGroup: (groupData: CreateStudyGroupData) => Promise<void>;
  joinStudyGroup: (groupId: string) => Promise<void>;
  leaveStudyGroup: (groupId: string) => Promise<void>;
}

export const useFriends = (userId: string | null, userName?: string, userAvatar?: string): UseFriendsReturn => {
  const cacheKey = `classmates_${userId}`;
  const cachedClassmates = userId ? dataCache.get<Classmate[]>(cacheKey) : null;
  
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [classmates, setClassmates] = useState<Classmate[]>(cachedClassmates || []);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(false); // Start false for instant render
  const [classmatesLoading, setClassmatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use useMemo to create a stable instance of FriendUseCase
  const friendUseCase = useMemo(() => new FriendUseCase(), []);

  useEffect(() => {
    console.log('🔍 useFriends: userId =', userId);
    
    if (!userId) {
      console.log('⚠️ useFriends: No userId provided, clearing data');
      setFriends([]);
      setFriendRequests([]);
      setStudyGroups([]);
      setClassmates([]);
      setLoading(false);
      setError(null);
      return;
    }

    console.log('🔄 useFriends: Setting up subscriptions for user:', userId);
    setError(null);

    // Defer loading until after screen renders
    const task = InteractionManager.runAfterInteractions(() => {
      setLoading(true);
    });

    try {
      // Subscribe to friends
      const unsubscribeFriends = friendUseCase.subscribeToFriends(
        userId,
        (updatedFriends) => {
          console.log('📥 useFriends: Received friends update:', updatedFriends.length);
          setFriends(updatedFriends);
          setLoading(false);
          setError(null);
        }
      );

      // Subscribe to friend requests
      const unsubscribeFriendRequests = friendUseCase.subscribeToFriendRequests(
        userId,
        (updatedRequests) => {
          console.log('📥 useFriends: Received friend requests update:', updatedRequests.length);
          setFriendRequests(updatedRequests);
        }
      );

      // Subscribe to study groups
      const unsubscribeStudyGroups = friendUseCase.subscribeToStudyGroups(
        userId,
        (updatedGroups) => {
          console.log('📥 useFriends: Received study groups update:', updatedGroups.length);
          setStudyGroups(updatedGroups);
        }
      );

      // Cleanup subscriptions on unmount
      return () => {
        console.log('🧹 useFriends: Cleaning up subscriptions for user:', userId);
        unsubscribeFriends();
        unsubscribeFriendRequests();
        unsubscribeStudyGroups();
      };
    } catch (error) {
      console.error('❌ useFriends: Error setting up subscriptions:', error);
      setError('Failed to load friends data');
      setLoading(false);
    }


  }, [userId]);

  const sendFriendRequest = useMemo(() => async (requestData: CreateFriendRequestData): Promise<void> => {
    if (!userId || !userName || !userAvatar) {
      throw new Error('User information not available');
    }

    try {
      setError(null);
      await friendUseCase.sendFriendRequest(userId, userName, userAvatar, requestData);
      // Real-time listener will update the requests automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, userName, userAvatar, friendUseCase]);

  const acceptFriendRequest = useMemo(() => async (requestId: string): Promise<void> => {
    try {
      setError(null);
      await friendUseCase.acceptFriendRequest(requestId);
      // Real-time listeners will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to accept friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [friendUseCase]);

  const declineFriendRequest = useMemo(() => async (requestId: string): Promise<void> => {
    try {
      setError(null);
      await friendUseCase.declineFriendRequest(requestId);
      // Real-time listeners will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to decline friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [friendUseCase]);

  const updateFriend = useMemo(() => async (friendId: string, updates: UpdateFriendData): Promise<void> => {
    try {
      setError(null);
      await friendUseCase.updateFriend(friendId, updates);
      // Real-time listener will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update friend';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [friendUseCase]);

  const removeFriend = useMemo(() => async (friendId: string): Promise<void> => {
    try {
      setError(null);
      await friendUseCase.removeFriend(friendId);
      // Real-time listener will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove friend';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [friendUseCase]);

  const toggleBestFriend = useMemo(() => async (friendId: string, isBestFriend: boolean): Promise<void> => {
    try {
      setError(null);
      await friendUseCase.toggleBestFriend(friendId, isBestFriend);
      // Real-time listener will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update best friend status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [friendUseCase]);

  const loadClassmates = useMemo(() => async (classroomId?: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setClassmatesLoading(true);
      // Don't clear global error for classmates loading
      const classmatesData = await friendUseCase.getClassmates(userId, classroomId);
      setClassmates(classmatesData);
      
      // Cache classmates data for 5 minutes
      dataCache.set(cacheKey, classmatesData, 5 * 60 * 1000);
    } catch (err: any) {
      console.error('❌ Error loading classmates:', err);
      // For classmates, we'll just set empty array and not show error
      // This is because it's a non-critical feature and permissions might not be set up
      setClassmates([]);
      
      // Only throw error if it's not a permissions issue
      if (!err.message?.includes('permissions') && !err.message?.includes('Missing or insufficient')) {
        const errorMessage = err.message || 'Failed to load classmates';
        throw new Error(errorMessage);
      }
    } finally {
      setClassmatesLoading(false);
    }
  }, [userId, friendUseCase]);

  const createStudyGroup = useMemo(() => async (groupData: CreateStudyGroupData): Promise<void> => {
    if (!userId || !userName) {
      throw new Error('User information not available');
    }

    try {
      setError(null);
      await friendUseCase.createStudyGroup(userId, userName, groupData);
      // Real-time listener will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create study group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, userName, friendUseCase]);

  const joinStudyGroup = useMemo(() => async (groupId: string): Promise<void> => {
    if (!userId || !userName) {
      throw new Error('User information not available');
    }

    try {
      setError(null);
      await friendUseCase.joinStudyGroup(groupId, userId, userName);
      // Real-time listener will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to join study group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, userName, friendUseCase]);

  const leaveStudyGroup = useMemo(() => async (groupId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await friendUseCase.leaveStudyGroup(groupId, userId);
      // Real-time listener will update automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to leave study group';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, friendUseCase]);

  // Computed values
  const bestFriends = useMemo(() => friends.filter(friend => friend.isBestFriend), [friends]);

  return {
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
    updateFriend,
    removeFriend,
    toggleBestFriend,
    loadClassmates,
    createStudyGroup,
    joinStudyGroup,
    leaveStudyGroup,
  };
};