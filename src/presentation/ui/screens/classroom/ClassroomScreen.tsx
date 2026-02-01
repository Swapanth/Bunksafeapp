import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { FirebaseAttendanceService } from '../../../../data/services/AttendanceService';
import { FirebaseClassroomService } from '../../../../data/services/ClassroomService';
import { useClassroomAnalytics } from '../../../hooks/useClassroomAnalytics';
import { WeeklyScheduleCalendar } from '../../components/WeeklyScheduleCalendar';
import { ClassroomSkeleton } from '../../components/skeletons';

const { width } = Dimensions.get('window');

// Pre-instantiate services to avoid recreation
let classroomServiceInstance: FirebaseClassroomService | null = null;
let attendanceServiceInstance: FirebaseAttendanceService | null = null;

const getClassroomService = () => {
  if (!classroomServiceInstance) {
    classroomServiceInstance = new FirebaseClassroomService();
  }
  return classroomServiceInstance;
};

const getAttendanceService = () => {
  if (!attendanceServiceInstance) {
    attendanceServiceInstance = new FirebaseAttendanceService();
  }
  return attendanceServiceInstance;
};

interface ClassroomScreenProps {
  userId: string;
}

export const ClassroomScreen: React.FC<ClassroomScreenProps> = ({ userId }) => {
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [currentSubjectPage, setCurrentSubjectPage] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [subjectDetails, setSubjectDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { analytics, loading, error, refreshing, refresh } = useClassroomAnalytics(userId);
  
  // Always show skeleton initially for instant render
  const showSkeleton = loading && !analytics;

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load subject details when a subject is selected
  useEffect(() => {
    const loadSubjectDetails = async () => {
      if (!selectedSubject) {
        setSubjectDetails(null);
        return;
      }

      try {
        setLoadingDetails(true);
        
        const classroomService = getClassroomService();
        const attendanceService = getAttendanceService();

        // Fetch schedule and prepare attendance dates in parallel
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        });

        const [schedule] = await Promise.all([
          classroomService.getClassroomSchedule(selectedSubject.classroomId)
        ]);
        
        // Find the class details from the schedule using classId from selectedSubject
        const classDetails = schedule?.classes.find((cls: any) => cls.id === selectedSubject.classId);
        
        // Get recent attendance records (last 5 days) with parallel fetching
        let recentAttendance: Array<{
          date: string;
          status: string;
          time: string;
        }> = [];
        
        if (selectedSubject.classId) {
          // Fetch all attendance records in parallel (much faster than sequential)
          const attendancePromises = dates.slice(0, 5).map(date =>
            attendanceService.getAttendanceRecord(userId, selectedSubject.classId, date)
              .then(record => ({ date, record }))
              .catch(err => {
                console.warn('Failed to fetch attendance for', date, err);
                return { date, record: null };
              })
          );

          const attendanceResults = await Promise.all(attendancePromises);
          
          recentAttendance = attendanceResults
            .filter(({ record }) => record !== null)
            .map(({ date, record }) => ({
              date: new Date(date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              }),
              status: record!.status,
              time: classDetails ? `${classDetails.startTime} - ${classDetails.endTime}` : 'N/A'
            }));
        }

        // Only update state if component is still mounted
        if (!isMountedRef.current) return;

        setSubjectDetails({
          ...selectedSubject,
          instructor: classDetails?.instructor || 'Not available',
          location: classDetails?.location || 'Not available',
          classDays: classDetails?.day || '',
          classTime: classDetails ? `${classDetails.startTime} - ${classDetails.endTime}` : '',
          recentAttendance
        });
      } catch (err) {
        console.error('Error loading subject details:', err);
        setSubjectDetails(selectedSubject);
      } finally {
        setLoadingDetails(false);
      }
    };

    loadSubjectDetails();
  }, [selectedSubject, userId]);

  // Subject pagination logic
  const SUBJECTS_PER_PAGE = 5;
  const subjects = analytics?.subjects || [];
  const totalPages = Math.ceil(subjects.length / SUBJECTS_PER_PAGE);
  const startIndex = currentSubjectPage * SUBJECTS_PER_PAGE;
  const endIndex = startIndex + SUBJECTS_PER_PAGE;
  const currentSubjects = subjects.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentSubjectPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentSubjectPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // Show loading state only on initial load (not when we have cached data)
  if (showSkeleton) {
    return <ClassroomSkeleton />;
  }

  // Show error state
  if (error && !analytics) {
    return (
      <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: '#fafafa' }}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
          Unable to Load Analytics
        </Text>
        <Text className="text-gray-600 mt-2 text-center">
          {error || 'Failed to load classroom analytics'}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          className="bg-green-500 px-6 py-3 rounded-lg mt-6"
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show skeleton while loading and no data yet
  if (!analytics) {
    return <ClassroomSkeleton />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        <View className="px-6 pt-16 py-6">
          {/* Classroom Overview */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Classroom Overview
              </Text>

            </View>
            

            {/* Classroom List */}
            <View className="space-y-4">
              {analytics.classroomOverview && analytics.classroomOverview.length > 0 ? (
                analytics.classroomOverview.map((classroom, index) => (
                  <TouchableOpacity
                    key={index}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View
                          className="w-12 h-12 rounded-2xl mr-4 items-center justify-center"
                          style={{ backgroundColor: `${classroom.color || '#3b82f6'}20` }}
                        >
                          <View
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: classroom.color || '#3b82f6' }}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-800 mb-1">{classroom.name}</Text>
                          <Text className="text-sm text-gray-600 leading-5">{classroom.description || 'No description available'}</Text>
                          {classroom.code && (
                            <TouchableOpacity
                              className="bg-gray-100 self-start px-3 py-1 rounded-full mt-2 flex-row items-center"
                              activeOpacity={0.7}
                              onPress={() => {
                                if (classroom.code) {
                                  Clipboard.setStringAsync(classroom.code);
                                }
                              }}
                            >
                              <Text className="text-xs font-medium text-gray-700 mr-1">Code: {classroom.code}</Text>
                              <Ionicons name="copy-outline" size={12} color="#374151" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View className="items-end ml-3">
                        <View className="bg-green-50 px-3 py-2 rounded-xl mb-2">
                          <Text className="text-sm font-bold text-green-700">{classroom.studentCount}</Text>
                          <Text className="text-xs text-green-600">students</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="bg-white rounded-2xl p-8 border border-gray-100 items-center">
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="school-outline" size={32} color="#9ca3af" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-800 mb-2">No Classrooms Yet</Text>
                  <Text className="text-gray-500 text-center text-sm leading-5">
                    Join or create your first classroom to get started with analytics
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowWeeklySchedule(true)}
              className="bg-green-500 px-2 items-center py-2 rounded-lg m-2"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
              
                <Text className="text-white font-medium ml-2">View Timetable</Text>
              </View>
            </TouchableOpacity>
            
          </View>

          {/* Subjects Section */}
          {subjects.length > 0 && (
            <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">
                  Subjects
                </Text>
                {totalPages > 1 && (
                  <Text className="text-sm text-gray-500">
                    {currentSubjectPage + 1} / {totalPages}
                  </Text>
                )}
              </View>

              {/* Subject Cards */}
                <View className="space-y-3">
                {currentSubjects.map((subject: any, index: number) => (
                  <TouchableOpacity
                  key={index}
                  className="bg-gradient-to-r rounded-xl p-3 border border-gray-100 m-1"
                  activeOpacity={0.7}
                  style={{ backgroundColor: '#fafafa' }}
                  onPress={() => setSelectedSubject(subject)}
                  >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: `${subject.color || '#3b82f6'}20` }}
                    >
                      <Ionicons 
                      name={subject.icon || 'book-outline'} 
                      size={20} 
                      color={subject.color || '#3b82f6'} 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-800 mb-0.5">
                      {subject.name}
                      </Text>
                      <Text className="text-xs text-gray-500">
                      {subject.code || 'N/A'}
                      </Text>
                    </View>
                    </View>
                    <View className="items-end">
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="time-outline" size={12} color="#6b7280" />
                      <Text className="text-xs text-gray-600 ml-1">
                      {subject.totalClasses || 0} classes
                      </Text>
                    </View>
                    <View 
                      className="px-2 py-0.5 rounded-full"
                      style={{ 
                      backgroundColor: 
                        (subject.attendance || 0) >= 75 ? '#dcfce7' : 
                        (subject.attendance || 0) >= 60 ? '#fef3c7' : '#fee2e2'
                      }}
                    >
                      <Text 
                      className="text-xs font-bold"
                      style={{ 
                        color: 
                        (subject.attendance || 0) >= 75 ? '#16a34a' : 
                        (subject.attendance || 0) >= 60 ? '#ca8a04' : '#dc2626'
                      }}
                      >
                      {subject.attendance || 0}%
                      </Text>
                    </View>
                    </View>
                  </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={currentSubjectPage === 0}
                    className={`flex-row items-center px-4 py-2 rounded-lg ${
                      currentSubjectPage === 0 ? 'bg-gray-100' : 'bg-green-500'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={16} 
                      color={currentSubjectPage === 0 ? '#9ca3af' : 'white'} 
                    />
                    <Text 
                      className={`font-medium ml-1 ${
                        currentSubjectPage === 0 ? 'text-gray-400' : 'text-white'
                      }`}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  {/* Page Indicators */}
                  <View className="flex-row items-center">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setCurrentSubjectPage(index)}
                        className="mx-1"
                      >
                        <View
                          className={`w-2 h-2 rounded-full ${
                            index === currentSubjectPage ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={currentSubjectPage === totalPages - 1}
                    className={`flex-row items-center px-4 py-2 rounded-lg ${
                      currentSubjectPage === totalPages - 1 ? 'bg-gray-100' : 'bg-green-500'
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text 
                      className={`font-medium mr-1 ${
                        currentSubjectPage === totalPages - 1 ? 'text-gray-400' : 'text-white'
                      }`}
                    >
                      Next
                    </Text>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={currentSubjectPage === totalPages - 1 ? '#9ca3af' : 'white'} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Weekly Performance Chart */}
          <View className="bg-white rounded-3xl p-6 mb-6 border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
              Weekly Performance
              </Text>

            </View>
            <View className="h-48 mb-4">
              <View className="flex-row items-end justify-between h-full px-2">
                {analytics.weeklyPerformance.map((item, index) => (
                  <View key={index} className="items-center flex-1">
                    <View
                      className="bg-green-500 rounded-t-lg mb-2"
                      style={{
                        height: `${Math.max(item.value, 5)}%`,
                        maxHeight: '90%',
                        width: 24,
                      }}
                    />
                    <Text className="text-xs text-gray-600 font-medium">
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>



          {/* Stats Grid */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
            This Week
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {analytics.weeklyStats.map((stat, index) => (
                <View key={index} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100" style={{ width: (width - 56) / 2 }}>
                  <View className="flex-row items-center justify-between mb-3">
                    <Ionicons name={stat.icon as any} size={24} color="#6b7280" />
                    <Text className={`text-sm font-semibold ${stat.color}`}>
                      {stat.change}
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Weekly Schedule Calendar */}
      <WeeklyScheduleCalendar
        visible={showWeeklySchedule}
        onClose={() => setShowWeeklySchedule(false)}
        userId={userId}
      />

      {/* Subject Detail Modal */}
      {selectedSubject && (
        <Modal
          visible={!!selectedSubject}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedSubject(null)}
        >
          <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => setSelectedSubject(null)}
                  className="flex-row items-center"
                >
                  <Ionicons name="chevron-back" size={20} color="#6b7280" />
                  <Text className="text-gray-600 ml-1">Back</Text>
                </TouchableOpacity>
                
                <View style={{ width: 60 }} />
              </View>
            </View>

            {loadingDetails ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-600">Loading details...</Text>
              </View>
            ) : (
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
              {/* Subject Header */}
              <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                <View className="flex-row items-start">
               
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-800 mb-1">
                      {String(subjectDetails?.name || selectedSubject?.name || '')}
                    </Text>
                    <Text className="text-lg text-gray-600 mb-2">
                      {String(subjectDetails?.code || selectedSubject?.code || 'N/A')}
                    </Text>
                    {subjectDetails?.instructor ? (
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="person-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">{String(subjectDetails.instructor)}</Text>
                      </View>
                    ) : null}
                    {subjectDetails?.location ? (
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="location-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">{String(subjectDetails.location)}</Text>
                      </View>
                    ) : null}
                    {(subjectDetails?.totalClasses || selectedSubject?.totalClasses) ? (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">{String(subjectDetails?.totalClasses || selectedSubject?.totalClasses)} classes</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Class Schedule */}
              {(subjectDetails?.classDays || subjectDetails?.classTime) ? (
                <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                  <Text className="text-xl font-bold text-gray-800 mb-4">Weekly Schedule</Text>
                  
                  {subjectDetails?.classDays ? (
                    <View className="mb-4">
                      <Text className="text-sm font-medium text-gray-600 mb-2">Class Days</Text>
                      <View className="flex-row flex-wrap">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                          const isActiveDay = subjectDetails.classDays?.toLowerCase().includes(day.toLowerCase());
                          const shortDay = day.substring(0, 3);
                          return (
                            <View
                              key={day}
                              className={`px-3 py-2 rounded-lg mr-2 mb-2`}
                              style={{
                                backgroundColor: isActiveDay ? '#dcfce7' : '#f3f4f6'
                              }}
                            >
                              <Text 
                                className="text-sm font-medium"
                                style={{
                                  color: isActiveDay ? '#16a34a' : '#6b7280'
                                }}
                              >
                                {shortDay}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  {subjectDetails?.classTime ? (
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-4">
                      <Ionicons name="time" size={20} color="#3b82f6" />
                      <Text className="text-gray-700 font-medium ml-3">{String(subjectDetails.classTime)}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Attendance Analytics */}
              <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                <Text className="text-xl font-bold text-gray-800 mb-4">📊 Attendance Analytics</Text>

                {/* Current Stats */}
                <View className="flex-row justify-between mb-6">
                  <View className="flex-1 items-center">
                    <Text
                      className="text-3xl font-bold"
                      style={{ 
                        color: (selectedSubject.attendance || 0) >= 75 ? '#10b981' : 
                               (selectedSubject.attendance || 0) >= 60 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {String(selectedSubject.attendance || 0)}%
                    </Text>
                    <Text className="text-gray-600 text-sm text-center">Current Attendance</Text>
                  </View>

                  <View className="flex-1 items-center">
                    <Text className="text-3xl font-bold text-blue-600">
                      {String(selectedSubject.attendedClasses || 0)}/{String(selectedSubject.totalClasses || 0)}
                    </Text>
                    <Text className="text-gray-600 text-sm text-center">Classes Attended</Text>
                  </View>

                  <View className="flex-1 items-center">
                    <Text className="text-3xl font-bold text-purple-600">
                      {String(selectedSubject.targetPercentage || 75)}%
                    </Text>
                    <Text className="text-gray-600 text-sm text-center">Required</Text>
                  </View>
                </View>

                {/* Attendance Status */}
                {(selectedSubject.attendance || 0) < (selectedSubject.targetPercentage || 75) ? (
                  <View className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="warning" size={24} color="#dc2626" />
                      <Text className="text-red-700 font-bold ml-2 text-lg">Attendance Critical!</Text>
                    </View>
                    <Text className="text-red-600 mt-2">
                      Your attendance is below the required {String(selectedSubject.targetPercentage || 75)}% threshold.
                    </Text>
                  </View>
                ) : (
                  <View className="bg-green-100 border border-green-200 rounded-lg p-4 mb-4">
                    <View className="flex-row items-center">
                      <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                      <Text className="text-green-700 font-bold ml-2 text-lg">Attendance On Track</Text>
                    </View>
                    <Text className="text-green-600 mt-2">
                      You're meeting the attendance requirements!
                    </Text>
                  </View>
                )}

                {/* Future Planning */}
                {selectedSubject.classesToAttend !== undefined ? (
                  <View>
                    <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-4 mb-3">
                      <View className="flex-row items-center flex-1">
                        <View className="bg-green-500 w-4 h-4 rounded-full mr-3"></View>
                        <Text className="text-gray-700 font-medium">Classes to attend</Text>
                      </View>
                      <Text className="text-green-600 font-bold text-xl">{String(selectedSubject.classesToAttend || 0)}</Text>
                    </View>

                    {selectedSubject.classesCanSkip !== undefined ? (
                      <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-4 mb-3">
                        <View className="flex-row items-center flex-1">
                          <View className="bg-orange-500 w-4 h-4 rounded-full mr-3"></View>
                          <Text className="text-gray-700 font-medium">Classes you can skip</Text>
                        </View>
                        <Text className="text-orange-600 font-bold text-xl">{String(selectedSubject.classesCanSkip || 0)}</Text>
                      </View>
                    ) : null}

                    <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-4">
                      <View className="flex-row items-center flex-1">
                        <View className="bg-red-500 w-4 h-4 rounded-full mr-3"></View>
                        <Text className="text-gray-700 font-medium">Classes missed</Text>
                      </View>
                      <Text className="text-red-600 font-bold text-xl">
                        {String((selectedSubject.totalClasses || 0) - (selectedSubject.attendedClasses || 0))}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Recent Attendance */}
              {subjectDetails?.recentAttendance && subjectDetails.recentAttendance.length > 0 ? (
                <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                  <Text className="text-xl font-bold text-gray-800 mb-4">🗓️ Recent Attendance</Text>
                  <View>
                    {subjectDetails.recentAttendance.slice(0, 5).map((record: any, index: number) => (
                      <View
                        key={index}
                        className={`flex-row items-center justify-between p-4 rounded-lg mb-2 ${
                          record.status === 'present' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <View className="flex-row items-center flex-1">
                          <Ionicons
                            name={record.status === 'present' ? 'checkmark-circle' : 'close-circle'}
                            size={20}
                            color={record.status === 'present' ? '#16a34a' : '#dc2626'}
                          />
                          <View className="ml-3">
                            <Text className="text-gray-800 font-medium">
                              {String(record.date || 'Unknown date')}
                            </Text>
                            {record.time ? (
                              <Text className="text-xs text-gray-500 mt-1">{String(record.time)}</Text>
                            ) : null}
                          </View>
                        </View>
                        <Text
                          className="text-sm font-bold"
                          style={{
                            color: record.status === 'present' ? '#16a34a' : '#dc2626'
                          }}
                        >
                          {record.status === 'present' ? 'Present' : 'Absent'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Additional Info */}
              {subjectDetails?.schedule ? (
                <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
                  <Text className="text-xl font-bold text-gray-800 mb-4">📅 Schedule</Text>
                  <Text className="text-gray-600">
                    {String(subjectDetails.schedule)}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
};
