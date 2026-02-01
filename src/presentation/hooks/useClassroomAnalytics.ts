import { useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
import { ClassroomAnalytics, FirebaseClassroomAnalyticsService } from '../../data/services/ClassroomAnalyticsService';
import { dataCache } from '../utils/DataCache';

// Reuse service instance across all hook invocations
let analyticsServiceInstance: FirebaseClassroomAnalyticsService | null = null;
const getAnalyticsService = () => {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new FirebaseClassroomAnalyticsService();
  }
  return analyticsServiceInstance;
};

export const useClassroomAnalytics = (userId: string | null) => {
  const cacheKey = `classroom_analytics_${userId}`;
  const cachedData = userId ? dataCache.get<ClassroomAnalytics>(cacheKey) : null;
  
  const [analytics, setAnalytics] = useState<ClassroomAnalytics | null>(cachedData);
  const [loading, setLoading] = useState(false); // Start as false to show screen immediately
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const analyticsService = useMemo(() => getAnalyticsService(), []);

  const loadAnalytics = async (isRefresh = false, cacheKey: string) => {
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
      
      // Cache the data for 5 minutes
      dataCache.set(cacheKey, data, 5 * 60 * 1000);
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
    loadAnalytics(true, cacheKey);
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Defer loading until after screen renders for instant UI  
    // Only load if we don't have cached data or it's a refresh
    if (!cachedData) {
      const task = InteractionManager.runAfterInteractions(() => {
        loadAnalytics(false, cacheKey);
      });
      return () => task.cancel();
    }
  }, [userId, cacheKey, cachedData]);

  return {
    analytics,
    loading,
    error,
    refreshing,
    refresh,
  };
};