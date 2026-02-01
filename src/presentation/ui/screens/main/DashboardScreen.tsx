import { DashboardData, TodaysClass } from '@/src/domain/model/Attendance';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, InteractionManager, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FirebaseAttendanceService } from '../../../../data/services/AttendanceService';
import { dataCache } from '../../../utils/DataCache';
import { DashboardSkeleton } from '../../components/skeletons/DashboardSkeleton';

// Pre-instantiate service outside component to avoid recreation
let attendanceServiceInstance: FirebaseAttendanceService | null = null;
const getAttendanceService = () => {
  if (!attendanceServiceInstance) {
    attendanceServiceInstance = new FirebaseAttendanceService();
  }
  return attendanceServiceInstance;
};


interface DashboardScreenProps {
  userId: string;
  onNavigateToClassroom?: (subject: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userId,
  onNavigateToClassroom
}) => {
  const cacheKey = `dashboard_${userId}`;
  const cachedData = dataCache.get<DashboardData>(cacheKey);
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(cachedData);
  const [loading, setLoading] = useState(false); // Start false for instant render
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubjectDetailModal, setShowSubjectDetailModal] = useState(false);
  const [showSemesterSetupModal, setShowSemesterSetupModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TodaysClass | null>(null);
  const [absentReason, setAbsentReason] = useState('');
  const [editMode, setEditMode] = useState<'present' | 'absent' | null>(null);

  // Semester setup state
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [semesterEndDate, setSemesterEndDate] = useState('');

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load dashboard data on component mount
  const loadDashboardData = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const attendanceService = getAttendanceService();

      console.log('📊 Loading dashboard for user:', userId);
      
      // Run auto-mark and data fetch in parallel for faster loading
      const [, data] = await Promise.all([
        attendanceService.autoMarkUnmarkedAsAbsent(userId).catch(err => {
          console.warn('⚠️ Auto-mark failed (non-critical):', err);
          return null; // Don't block loading if this fails
        }),
        attendanceService.getDashboardData(userId)
      ]);

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (data) {
        console.log('✅ Dashboard data loaded successfully');
        setDashboardData(data);
        
        // Cache the data for 3 minutes (dashboard updates frequently)
        dataCache.set(cacheKey, data, 3 * 60 * 1000);
      } else {
        console.error('❌ getDashboardData returned null');
        const errorMsg = 'Failed to load dashboard data - service returned null';
        setError(errorMsg);
        Alert.alert('Debug Info', `Dashboard data is null for user: ${userId}`);
      }
    } catch (err) {
      console.error('❌ Error loading dashboard data:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        const errorMsg = `Failed to load dashboard: ${err.message}`;
        setError(errorMsg);
        Alert.alert('Dashboard Error', `${err.message}\n\nUser: ${userId}`);
      } else {
        setError('Failed to load dashboard data');
        Alert.alert('Dashboard Error', 'Unknown error occurred');
      }
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    // Only load if we don't have cached data
    if (!cachedData) {
      // Defer loading until after screen renders for instant UI
      const task = InteractionManager.runAfterInteractions(() => {
        setLoading(true);
        loadDashboardData();
      });

      return () => task.cancel();
    }
  }, [loadDashboardData, cachedData]);

  const onRefresh = () => {
    loadDashboardData(true);
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const calculateAttendanceDetails = (classItem: TodaysClass) => {
    const { 
      totalClasses = 0, 
      attendedClasses = 0, 
      requiredAttendancePercentage = 75,
      TotalClassesForSemester = 0
    } = classItem;

    // Calculate current attendance
    const currentAttendancePercentage = totalClasses > 0 
      ? (attendedClasses / totalClasses) * 100 
      : 0;

    // Use expected total classes for semester, or fallback to classes so far
    const totalExpectedClasses = TotalClassesForSemester || totalClasses;
    const remainingClasses = Math.max(0, totalExpectedClasses - totalClasses);

    // Calculate how many classes need to attend to reach required percentage
    const requiredTotalAttended = Math.ceil((requiredAttendancePercentage / 100) * totalExpectedClasses);
    const classesToAttend = Math.max(0, requiredTotalAttended - attendedClasses);

    // Calculate how many classes can be skipped
    const maxAllowedAbsences = totalExpectedClasses - requiredTotalAttended;
    const currentAbsences = totalClasses - attendedClasses;
    const classesCanSkip = Math.max(0, maxAllowedAbsences - currentAbsences);

    return {
      currentAttendancePercentage: Math.round(currentAttendancePercentage * 100) / 100,
      classesToAttend,
      classesCanSkip,
      remainingClasses,
      totalClassesSoFar: totalClasses,
      totalAttendedSoFar: attendedClasses,
      isAttendanceCritical: currentAttendancePercentage < requiredAttendancePercentage
    };
  };

  const handleSubjectClick = (classItem: TodaysClass) => {
    setSelectedClass(classItem);
    setShowSubjectDetailModal(true);
  };

  const updateAttendanceStreak = (attended: boolean) => {
    if (!dashboardData) return;

    const today = getCurrentDate();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (attended) {
      const updatedStreak = { ...dashboardData.attendanceStreak };

      if (updatedStreak.lastCheckedDate === yesterday) {
        updatedStreak.currentStreak += 1;
        updatedStreak.lastCheckedDate = today;
        updatedStreak.totalDaysMarked += 1;
      } else if (updatedStreak.lastCheckedDate !== today) {
        updatedStreak.currentStreak = 1;
        updatedStreak.lastCheckedDate = today;
        updatedStreak.totalDaysMarked += 1;
      }

      setDashboardData(prev => prev ? { ...prev, attendanceStreak: updatedStreak } : null);
    }
  };

  const handleCheckIn = async (classItem: TodaysClass, attended: boolean, reason?: string) => {
    try {
      const { FirebaseAttendanceService } = await import('../../../../data/services/AttendanceService');
      const attendanceService = new FirebaseAttendanceService();

      const result = await attendanceService.markAttendance(
        userId,
        classItem.classroomId,
        classItem.classId,
        attended ? 'present' : 'absent',
        reason,
        classItem.subject
      );

      if (result.success) {
        // Fetch updated streak from database (regardless of present/absent)
        const updatedStreak = await attendanceService.getAttendanceStreak(userId);
        if (updatedStreak && dashboardData) {
          setDashboardData(prev => prev ? { ...prev, attendanceStreak: updatedStreak } : null);
        }

        // Update local state for checked-in classes
        if (dashboardData) {
          const updatedClasses = dashboardData.todaysClasses.map(item =>
            item.id === classItem.id
              ? {
                ...item,
                isCheckedIn: true,
                attendanceStatus: (attended ? 'present' : 'absent') as 'present' | 'absent',
                reason: attended ? undefined : reason
              }
              : item
          );

          setDashboardData(prev => prev ? { ...prev, todaysClasses: updatedClasses } : null);
        }

        if (attended) {
          Alert.alert('✅ Checked In', `You've marked attendance for ${classItem.subject}!`);
        } else {
          Alert.alert('📝 Absence Noted', `Your absence for ${classItem.subject} has been recorded.`);
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert('Error', 'Failed to mark attendance');
    }
  };

  const openReasonModal = (classItem: TodaysClass) => {
    setSelectedClass(classItem);
    setShowReasonModal(true);
  };

  const submitAbsence = () => {
    if (selectedClass && absentReason.trim()) {
      handleCheckIn(selectedClass, false, absentReason);
      setShowReasonModal(false);
      setAbsentReason('');
      setSelectedClass(null);
    } else {
      Alert.alert('Error', 'Please provide a reason for absence.');
    }
  };

  const handleEditAttendance = (classItem: TodaysClass) => {
    setSelectedClass(classItem);
    setAbsentReason(classItem.reason || '');
    setShowEditModal(true);
  };

  const confirmEdit = async (newStatus: 'present' | 'absent') => {
    setEditMode(newStatus);
    if (newStatus === 'absent') {
      setShowEditModal(false);
      setShowReasonModal(true);
    } else {
      // Mark as present
      if (selectedClass) {
        try {
          const { FirebaseAttendanceService } = await import('../../../../data/services/AttendanceService');
          const attendanceService = new FirebaseAttendanceService();

          const today = getCurrentDate();
          const result = await attendanceService.updateAttendance(
            userId,
            selectedClass.classId,
            today,
            'present'
          );

          if (result.success) {
            // Fetch updated streak from database
            const updatedStreak = await attendanceService.getAttendanceStreak(userId);
            if (updatedStreak && dashboardData) {
              setDashboardData(prev => prev ? { ...prev, attendanceStreak: updatedStreak } : null);
            }

            // Update local state
            if (dashboardData) {
              const updatedClasses = dashboardData.todaysClasses.map(item =>
                item.id === selectedClass.id
                  ? { ...item, isCheckedIn: true, attendanceStatus: 'present' as const, reason: undefined }
                  : item
              );

              setDashboardData(prev => prev ? { ...prev, todaysClasses: updatedClasses } : null);
            }

            Alert.alert('✅ Updated', `${selectedClass.subject} marked as present!`);
          } else {
            Alert.alert('Error', result.error || 'Failed to update attendance');
          }
        } catch (error) {
          console.error('Error updating attendance:', error);
          Alert.alert('Error', 'Failed to update attendance');
        }
      }
      setShowEditModal(false);
      setSelectedClass(null);
      setEditMode(null);
      setAbsentReason('');
    }
  };

  const submitEdit = async () => {
    if (selectedClass && editMode === 'absent' && absentReason.trim()) {
      try {
        const { FirebaseAttendanceService } = await import('../../../../data/services/AttendanceService');
        const attendanceService = new FirebaseAttendanceService();

        const today = getCurrentDate();
        const result = await attendanceService.updateAttendance(
          userId,
          selectedClass.classId,
          today,
          'absent',
          absentReason
        );

        if (result.success) {
          // Fetch updated streak from database
          const updatedStreak = await attendanceService.getAttendanceStreak(userId);
          if (updatedStreak && dashboardData) {
            setDashboardData(prev => prev ? { ...prev, attendanceStreak: updatedStreak } : null);
          }

          // Update local state
          if (dashboardData) {
            const updatedClasses = dashboardData.todaysClasses.map(item =>
              item.id === selectedClass.id
                ? { ...item, isCheckedIn: true, attendanceStatus: 'absent' as const, reason: absentReason }
                : item
            );

            setDashboardData(prev => prev ? { ...prev, todaysClasses: updatedClasses } : null);
          }

          Alert.alert('📝 Updated', `${selectedClass.subject} marked as absent with reason.`);
        } else {
          Alert.alert('Error', result.error || 'Failed to update attendance');
        }
      } catch (error) {
        console.error('Error updating attendance:', error);
        Alert.alert('Error', 'Failed to update attendance');
      }

      setShowReasonModal(false);
      setAbsentReason('');
      setSelectedClass(null);
      setEditMode(null);
    } else if (editMode === 'absent') {
      Alert.alert('Error', 'Please provide a reason for absence.');
    }
  };

  const closeModals = () => {
    setShowReasonModal(false);
    setShowEditModal(false);
    setShowSubjectDetailModal(false);
    setShowSemesterSetupModal(false);
    setSelectedClass(null);
    setAbsentReason('');
    setEditMode(null);
    setSemesterStartDate('');
    setSemesterEndDate('');
  };

  const handleSemesterSetup = async () => {
    if (!semesterStartDate.trim() || !semesterEndDate.trim()) {
      Alert.alert('Error', 'Please enter both start and end dates');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(semesterStartDate.trim()) || !dateRegex.test(semesterEndDate.trim())) {
      Alert.alert('Error', 'Please use DD/MM/YYYY format (e.g., 01/04/2025)');
      return;
    }

    try {
      const { FirebaseUserService } = await import('../../../../data/services/UserService');
      const userService = new FirebaseUserService();

      await userService.updateUserProfile(userId, {
        semesterStartDate: semesterStartDate.trim(),
        semesterEndDate: semesterEndDate.trim(),
      });

      Alert.alert('Success', 'Semester dates updated successfully!');
      setShowSemesterSetupModal(false);
      
      // Reload dashboard data to reflect changes
      loadDashboardData();
    } catch (error) {
      console.error('Error updating semester dates:', error);
      Alert.alert('Error', 'Failed to update semester dates');
    }
  };

  // Show loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: '#fafafa' }}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          Unable to Load Dashboard
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error || 'Failed to load dashboard data'}
        </Text>
        <TouchableOpacity
          onPress={() => loadDashboardData()}
          className="bg-green-500 px-6 py-3 rounded-lg mt-6"
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Header */}
        <View className="border-b border-gray-100">
          <View className="px-6 pt-16 pb-6">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Namaste 🙏
            </Text>
            <Text className="text-xl text-green-600 font-medium">
              {dashboardData.userName}
            </Text>
          </View>

          <View className="px-6 py-6">
            {/* Quick Stats */}
            <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 m-1">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">🔥</Text>
                <View>
                  <Text className="text-black text-2xl font-bold">{dashboardData.attendanceStreak.currentStreak}-day streak</Text>
                  <Text className="text-gray-600">Total days marked: {dashboardData.attendanceStreak.totalDaysMarked}</Text>
                </View>
              </View>
            </View>

          
            {/* Semester Progress */}
            {dashboardData.semesterInfo ? (
              <View className="bg-white rounded-2xl p-4 border border-gray-100 m-1 mb-2">
                <View className="flex-row items-center mb-3">
                  <Text className="text-lg font-bold text-gray-800">Semester Progress</Text>
                </View>
                
                <View className="mb-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-600 text-sm">Progress</Text>
                    <Text className="text-gray-600 text-sm">
                      {dashboardData.semesterInfo.elapsedWorkingDays} / {dashboardData.semesterInfo.totalWorkingDays} days
                    </Text>
                  </View>
                  <View className="bg-gray-200 h-2 rounded-full">
                    <View 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.min(dashboardData.semesterInfo.progressPercentage, 100)}%` }}
                    />
                  </View>
                  <Text className="text-xs text-gray-500 text-center mt-1">
                    {dashboardData.semesterInfo.progressPercentage.toFixed(1)}% complete
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <View className="flex-1 items-center">
                    <Text className={`text-lg font-bold ${dashboardData.semesterInfo.isOnTrack ? 'text-green-600' : 'text-red-600'}`}>
                      {dashboardData.semesterInfo.requiredAttendanceDays}
                    </Text>
                    <Text className="text-gray-600 text-xs text-center">More days needed</Text>
                  </View>

                  <View className="flex-1 items-center">
                    <Text className="text-lg font-bold text-green-600">
                      {dashboardData.semesterInfo.currentPerformancePercentage}%
                    </Text>
                    <Text className="text-gray-600 text-xs text-center">Current rate</Text>
                  </View>

                  <View className="flex-1 items-center">
                    <Text className="text-lg font-bold text-orange-600">
                      {dashboardData.semesterInfo.canSkipDays}
                    </Text>
                    <Text className="text-gray-600 text-xs text-center">Can skip</Text>
                  </View>
                </View>

                {/* Performance Analysis */}
                <View className="mt-3 p-3 bg-green-50 rounded-lg">
                  <Text className="text-green-800 text-sm font-medium mb-1">
                    Performance Analysis:
                  </Text>
                  <Text className="text-green-700 text-sm">
                    Current: {dashboardData.semesterInfo.currentPerformancePercentage}% • 
                    Target: {dashboardData.semesterInfo.targetAttendancePercentage}% 
                  </Text>
                </View>

                {/* Status indicator */}
                <View className={`mt-2 p-2 rounded-lg ${dashboardData.semesterInfo.isOnTrack ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className={`text-center text-sm font-medium ${dashboardData.semesterInfo.isOnTrack ? 'text-green-800' : 'text-red-800'}`}>
                    {dashboardData.semesterInfo.isOnTrack 
                      ? `🎯 On track! Keep up the good work`
                      : `⚠️ Need to improve attendance rate`
                    }
                  </Text>
                </View>
              </View>
            ) : (
              // Show setup button when semester info is not available
              <View className="bg-orange-50 rounded-2xl p-4 border border-orange-200 m-1 mb-2">
                <View className="flex-row items-center mb-3">
                  <Text className="text-2xl mr-2">⚠️</Text>
                  <Text className="text-lg font-bold text-orange-800">Setup Required</Text>
                </View>
                
                <Text className="text-orange-700 text-sm mb-4">
                  Set your semester dates to see detailed attendance tracking and progress.
                </Text>
                
                <TouchableOpacity
                  onPress={() => setShowSemesterSetupModal(true)}
                  className="bg-orange-500 py-3 px-4 rounded-lg"
                >
                  <Text className="text-white font-medium text-center">Setup Semester Dates</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row space-x-4">
              <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 m-1">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  <Text className="text-2xl font-bold text-gray-800">{dashboardData.totalTasks}</Text>
                </View>
                <Text className="text-gray-600 text-sm">Tasks</Text>
              </View>

              <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 m-1">
                <View className="flex-row items-center justify-between mb-2">
                  <Ionicons name="stats-chart" size={24} color="#f59e0b" />
                  <Text className="text-2xl font-bold text-gray-800">{dashboardData.semesterInfo?.currentPerformancePercentage ?? 0}%</Text>
                </View>
                <Text className="text-gray-600 text-sm">Current Attendance</Text>
              </View>
            </View>

          </View>

          {/* Today's Classes with Check-in */}
          <View className="bg-white rounded-3xl p-6 border border-gray-100 ml-5 mr-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">📚</Text>
                <Text className="text-xl font-bold text-gray-800">
                  Today&apos;s Classes
                </Text>
              </View>

              
            </View>
            <View className="space-y-3">
              {dashboardData.todaysClasses.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
                  <Text className="text-gray-500 text-lg font-medium mt-4">No classes today</Text>
                  <Text className="text-gray-400 text-sm mt-1">Enjoy your free day!</Text>
                </View>
              ) : (
                dashboardData.todaysClasses.map((classItem, index) => (
                  <View key={`${classItem.id}_${classItem.subject}_${index}`} className={`flex-row items-center p-4 rounded-2xl border ${index < dashboardData.todaysClasses.length - 1 ? 'mb-2' : ''} ${classItem.subject === 'Mathematics' ? 'bg-green-50 border-green-100' :
                    classItem.subject === 'Physics' ? 'bg-purple-50 border-purple-100' :
                      'bg-green-50 border-green-100'
                    }`}>
                    <View className={`w-4 h-4 rounded-full mr-4 ${classItem.subject === 'Mathematics' ? 'bg-green-500' :
                      classItem.subject === 'Physics' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`}></View>
                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => handleSubjectClick(classItem)}
                      activeOpacity={0.7}
                    >
                      <Text className="font-semibold text-gray-800">{classItem.subject}</Text>
                      <Text className="text-gray-600 text-sm">{classItem.time}</Text>
                      {classItem.isCheckedIn && classItem.attendanceStatus === 'absent' && classItem.reason && (
                        <Text className="text-red-500 text-xs mt-1">Absent: {classItem.reason}</Text>
                      )}
                    </TouchableOpacity>

                    <View className="flex-row items-center space-x-2">


                      {!classItem.isCheckedIn ? (
                        <>
                          <TouchableOpacity
                            onPress={() => handleCheckIn(classItem, true)}
                            className="bg-green-400 px-2 py-2 rounded-lg m-1"
                          >
                            <Ionicons name="checkmark" size={16} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => openReasonModal(classItem)}
                            className="bg-red-400 px-2 py-2 rounded-lg m-1"
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          {classItem.attendanceStatus === 'absent' ? (
                            <View className="bg-red-100 px-3 py-2 rounded-lg m-1">
                              <Text className="text-red-600 text-xs font-medium">Absent</Text>
                            </View>
                          ) : (
                            <View className="bg-green-100 px-3 py-2 rounded-lg m-1">
                              <Text className="text-green-600 text-xs font-medium">Present</Text>
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => handleEditAttendance(classItem)}
                            className="bg-green-500 px-2 py-2 rounded-lg m-1"
                          >
                            <Ionicons name="pencil" size={14} color="white" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>


          {/* Bottom Padding */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Absence Reason Modal */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModals}
      >
        <View className="flex-1 justify-end  bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              {editMode ? 'Update Absence Reason' : 'Reason for Absence'}
            </Text>
            <Text className="text-gray-600 mb-4">
              Please provide a reason for missing {selectedClass?.subject}:
            </Text>

            <TextInput
              value={absentReason}
              onChangeText={setAbsentReason}
              placeholder="e.g., Sick, Emergency, etc."
              className="border border-gray-300 rounded-lg p-3 mb-4 text-gray-800"
              multiline
              numberOfLines={3}
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={closeModals}
                className="flex-1 bg-gray-200 py-3 rounded-lg m-1"
              >
                <Text className="text-center text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={editMode ? submitEdit : submitAbsence}
                className="flex-1 bg-red-500 py-3 rounded-lg m-1"
              >
                <Text className="text-center text-white font-medium">
                  {editMode ? 'Update' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Attendance Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModals}
      >
        <View className="flex-1 justify-end bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Edit Attendance
            </Text>
            <Text className="text-gray-600 mb-4">
              Update your attendance for {selectedClass?.subject}:
            </Text>

            <View className="space-y-3 mb-6">
              <TouchableOpacity
                onPress={() => confirmEdit('present')}
                className="flex-row items-center p-4 bg-green-50 border border-green-200 rounded-lg m-2"
              >
                <View className="bg-green-500 w-4 h-4 rounded-full mr-3"></View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">Mark as Present</Text>
                  <Text className="text-gray-600 text-sm">I attended this class</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => confirmEdit('absent')}
                className="flex-row items-center p-4 bg-red-50 border border-red-200 rounded-lg m-2"
              >
                <View className="bg-red-500 w-4 h-4 rounded-full mr-3"></View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">Mark as Absent</Text>
                  <Text className="text-gray-600 text-sm">I missed this class</Text>
                </View>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={closeModals}
              className="bg-gray-200 py-3 rounded-lg"
            >
              <Text className="text-center text-gray-700 font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Subject Detail Modal */}
      <Modal
        visible={showSubjectDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModals}
      >
        <View className="flex-1 justify-end  bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6 max-h-4/5">
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedClass && (
                <>
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-gray-800 mb-1">
                        {selectedClass.subject}
                      </Text>
                      <Text className="text-gray-600">{selectedClass.time}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={closeModals}
                      className="bg-gray-100 p-2 rounded-full"
                    >
                      <Ionicons name="close" size={24} color="#6b7280" />
                    </TouchableOpacity>
                  </View>

                  {/* Course Details */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <Text className="text-lg font-semibold text-gray-800 mb-3">
                      📚 Course Details
                    </Text>

                    <View className="space-y-3">
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={20} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">Instructor:</Text>
                        <Text className="text-gray-800 font-medium ml-2">
                          {selectedClass.instructor || 'Not specified'}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="location" size={20} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">Room:</Text>
                        <Text className="text-gray-800 font-medium ml-2">
                          {selectedClass.room || 'Not specified'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Attendance Analytics */}
                  {(() => {
                    const details = calculateAttendanceDetails(selectedClass);
                    return (
                      <View className="bg-green-50 rounded-2xl p-4 mb-6">
                        <Text className="text-lg font-semibold text-gray-800 mb-3">
                          📊 Attendance Analytics
                        </Text>

                        {/* Current Stats */}
                        <View className="flex-row justify-between mb-4">
                          <View className="flex-1 items-center">
                            <Text className={`text-2xl font-bold ${details.isAttendanceCritical ? 'text-red-600' : 'text-green-600'}`}>
                              {details.currentAttendancePercentage}%
                            </Text>
                            <Text className="text-gray-600 text-sm text-center">Current Attendance</Text>
                          </View>

                          <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-green-600">
                              {details.totalAttendedSoFar}/{details.totalClassesSoFar}
                            </Text>
                            <Text className="text-gray-600 text-sm text-center">Classes Attended</Text>
                          </View>

                          <View className="flex-1 items-center">
                            <Text className="text-2xl font-bold text-purple-600">
                              {selectedClass.requiredAttendancePercentage || 75}%
                            </Text>
                            <Text className="text-gray-600 text-sm text-center">Required</Text>
                          </View>
                        </View>

                        {/* Attendance Status */}
                        {details.isAttendanceCritical ? (
                          <View className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
                            <View className="flex-row items-center">
                              <Ionicons name="warning" size={20} color="#dc2626" />
                              <Text className="text-red-700 font-medium ml-2">Attendance Critical!</Text>
                            </View>
                            <Text className="text-red-600 text-sm mt-1">
                              Your attendance is below the required {selectedClass.requiredAttendancePercentage}% threshold.
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-green-100 border border-green-200 rounded-lg p-3 mb-4">
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                              <Text className="text-green-700 font-medium ml-2">Attendance On Track</Text>
                            </View>
                            <Text className="text-green-600 text-sm mt-1">
                              You&apos;re meeting the attendance requirements!
                            </Text>
                          </View>
                        )}

                        {/* Future Planning */}
                        <View className="space-y-3">
                          <View className="flex-row items-center justify-between bg-white rounded-lg p-3">
                            <View className="flex-row items-center flex-1">
                              <View className="bg-green-500 w-3 h-3 rounded-full mr-3"></View>
                              <Text className="text-gray-700">Classes to attend</Text>
                            </View>
                            <Text className="text-green-600 font-bold text-lg">{details.classesToAttend}</Text>
                          </View>

                          <View className="flex-row items-center justify-between bg-white rounded-lg p-3">
                            <View className="flex-row items-center flex-1">
                              <View className="bg-orange-500 w-3 h-3 rounded-full mr-3"></View>
                              <Text className="text-gray-700">Classes you can skip</Text>
                            </View>
                            <Text className="text-orange-600 font-bold text-lg">{details.classesCanSkip}</Text>
                          </View>
                        </View>

                        {/* Tips */}
                        <View className="bg-green-100 border border-green-200 rounded-lg p-3 mt-4">
                          <Text className="text-green-800 font-medium mb-1">💡 Pro Tip:</Text>
                          <Text className="text-green-700 text-sm">
                            {details.classesToAttend > 0
                              ? `Attend the next ${details.classesToAttend} classes to maintain your required attendance.`
                              : details.classesCanSkip > 0
                                ? `You can safely skip up to ${details.classesCanSkip} more classes and still meet requirements.`
                                : 'Keep attending classes to maintain your good attendance record!'
                            }
                          </Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Quick Actions */}
                  <View className="space-y-3">
                    <Text className="text-lg font-semibold text-gray-800 mb-2">
                      ⚡ Quick Actions
                    </Text>

                    {!selectedClass.isCheckedIn ? (
                      <View className="flex-row space-x-3">
                        <TouchableOpacity
                          onPress={() => {
                            handleCheckIn(selectedClass, true);
                            closeModals();
                          }}
                          className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center m-1"
                        >
                          <Ionicons name="checkmark" size={20} color="white" />
                          <Text className="text-white font-medium ml-2">Mark Present</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setShowSubjectDetailModal(false);
                            openReasonModal(selectedClass);
                          }}
                          className="flex-1 bg-red-500 py-3 rounded-lg flex-row items-center justify-center m-1"
                        >
                          <Ionicons name="close" size={20} color="white" />
                          <Text className="text-white font-medium ml-2">Mark Absent</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setShowSubjectDetailModal(false);
                          handleEditAttendance(selectedClass);
                        }}
                        className="bg-green-500 py-3 rounded-lg flex-row items-center justify-center"
                      >
                        <Ionicons name="pencil" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">Edit Attendance</Text>
                      </TouchableOpacity>
                    )}

                    {onNavigateToClassroom && (
                      <TouchableOpacity
                        onPress={() => {
                          onNavigateToClassroom(selectedClass.subject);
                          closeModals();
                        }}
                        className="bg-purple-500 py-3 rounded-lg flex-row items-center justify-center"
                      >
                        <Ionicons name="school" size={20} color="white" />
                        <Text className="text-white font-medium ml-2">Go to Classroom</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Semester Setup Modal */}
      <Modal
        visible={showSemesterSetupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModals}
      >
        <View className="flex-1 justify-end bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Setup Semester Dates
            </Text>
            <Text className="text-gray-600 mb-4">
              Enter your semester start and end dates to enable detailed attendance tracking.
            </Text>
            <Text className="text-green-600 text-sm mb-4">
              💡 Example: For Apr 2025 - Nov 2025 semester, use:
              Start: 01/04/2025, End: 01/11/2025
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Semester Start Date</Text>
              <TextInput
                value={semesterStartDate}
                onChangeText={setSemesterStartDate}
                placeholder="01/04/2025"
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              />
              <Text className="text-gray-500 text-xs mt-1">Format: DD/MM/YYYY</Text>
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Semester End Date</Text>
              <TextInput
                value={semesterEndDate}
                onChangeText={setSemesterEndDate}
                placeholder="01/11/2025"
                className="border border-gray-300 rounded-lg p-3 text-gray-800"
              />
              <Text className="text-gray-500 text-xs mt-1">Format: DD/MM/YYYY</Text>
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={closeModals}
                className="flex-1 bg-gray-200 py-3 rounded-lg m-1"
              >
                <Text className="text-center text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSemesterSetup}
                className="flex-1 bg-orange-500 py-3 rounded-lg m-1"
              >
                <Text className="text-center text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </View>
  );
};
