import { useEffect, useState } from 'react';
import { UserProfile, UserProfileService } from '../../data/services/UserProfileService';

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  createOrUpdateProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  updateStatus: (status: 'online' | 'offline' | 'studying' | 'away') => Promise<void>;
  updateClassroom: (classroomId: string) => Promise<void>;
}

export const useUserProfile = (userId: string | null): UseUserProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileService] = useState(() => new UserProfileService());

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userProfile = await profileService.getProfile(userId);
        setProfile(userProfile);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId, profileService]);

  const createOrUpdateProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setError(null);
      await profileService.createOrUpdateProfile(userId, profileData);
      
      // Reload profile after update
      const updatedProfile = await profileService.getProfile(userId);
      setProfile(updatedProfile);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateStatus = async (status: 'online' | 'offline' | 'studying' | 'away'): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setError(null);
      await profileService.updateStatus(userId, status);
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          status,
          lastSeen: new Date(),
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateClassroom = async (classroomId: string): Promise<void> => {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      setError(null);
      await profileService.updateClassroom(userId, classroomId);
      
      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          classroomId,
        });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update classroom';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    profile,
    loading,
    error,
    createOrUpdateProfile,
    updateStatus,
    updateClassroom,
  };
};