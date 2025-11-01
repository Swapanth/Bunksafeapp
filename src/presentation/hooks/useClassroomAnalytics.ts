import { useEffect, useState } from 'react';
import { ClassroomAnalytics, FirebaseClassroomAnalyticsService } from '../../data/services/ClassroomAnalyticsService';

export const useClassroomAnalytics = (userId: string | null) => {
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const analyticsService = new FirebaseClassroomAnalyticsService();

  const loadAnalytics = async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      setError('User ID is required');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await analyticsService.getClassroomAnalytics(userId);
      setAnalytics(data);
    } catch (err) {
      console.error('Error loading classroom analytics:', err);
      setError('Failed to load classroom analytics');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const refresh = () => {
    loadAnalytics(true);
  };

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  return {
    analytics,
    loading,
    error,
    refreshing,
    refresh,
  };
};