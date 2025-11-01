import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AttendanceSummary } from '../../../domain/model/Attendance';
import { ScheduleEditModal } from './ScheduleEditModal';
import { ScheduleSkeleton } from './skeletons/ScheduleSkeleton';

interface WeeklyClass {
  id: string;
  classId: string;
  classroomId: string;
  subject: string;
  instructor: string;
  startTime: string;
  endTime: string;
  location: string;
  color: string;
  day: string;
  attendanceSummary?: AttendanceSummary;
  todayAttendance?: 'present' | 'absent' | null;
}

interface WeeklyScheduleCalendarProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Color palette for dynamic subject colors
const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#8b5a2b', // brown
  '#6b7280', // gray
];

export const WeeklyScheduleCalendar: React.FC<WeeklyScheduleCalendarProps> = ({
  visible,
  onClose,
  userId
}) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<WeeklyClass | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<{ [key: string]: WeeklyClass[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectColors, setSubjectColors] = useState<{ [key: string]: string }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);

  // Generate consistent color for a subject name
  const generateSubjectColor = (subjectName: string): string => {
    // Use a simple hash function to get consistent colors for the same subject
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      const char = subjectName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
    return COLOR_PALETTE[colorIndex];
  };

  // Load schedule data when component mounts or userId changes
  useEffect(() => {
    if (visible && userId) {
      loadWeeklySchedule();
    }
  }, [visible, userId]);

  const loadWeeklySchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const { FirebaseClassroomService } = await import('../../../data/services/ClassroomService');
      const { FirebaseAttendanceService } = await import('../../../data/services/FirebaseAttendanceService');

      const classroomService = new FirebaseClassroomService();
      const attendanceService = new FirebaseAttendanceService();

      // Get user's classrooms
      const classrooms = await classroomService.getUserClassrooms(userId);
      const scheduleData: { [key: string]: WeeklyClass[] } = {};

      // Initialize empty arrays for each day
      DAYS_OF_WEEK.forEach(day => {
        scheduleData[day] = [];
      });

      const today = new Date().toISOString().split('T')[0];
      const dynamicSubjectColors: { [key: string]: string } = {};

      for (const classroom of classrooms) {
        // Get schedule for this classroom
        const schedule = await classroomService.getClassroomSchedule(classroom.id);

        if (schedule) {
          for (const cls of schedule.classes) {
            // Get attendance summary for this class
            const attendanceSummary = await attendanceService.getAttendanceSummary(
              userId,
              cls.id,
              classroom.attendanceTarget
            );

            // Check today's attendance if it's the same day
            const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            let todayAttendance: 'present' | 'absent' | null = null;

            if (cls.day === todayDay) {
              const todayRecord = await attendanceService.getAttendanceRecord(userId, cls.id, today);
              todayAttendance = todayRecord?.status || null;
            }

            // Generate or get existing color for this subject
            if (!dynamicSubjectColors[cls.name]) {
              dynamicSubjectColors[cls.name] = generateSubjectColor(cls.name);
            }

            const weeklyClass: WeeklyClass = {
              id: cls.id,
              classId: cls.id,
              classroomId: classroom.id,
              subject: cls.name,
              instructor: cls.instructor,
              startTime: cls.startTime,
              endTime: cls.endTime,
              location: cls.location,
              color: dynamicSubjectColors[cls.name],
              day: cls.day,
              attendanceSummary: attendanceSummary || undefined,
              todayAttendance
            };

            if (scheduleData[cls.day]) {
              scheduleData[cls.day].push(weeklyClass);
            }
          }
        }
      }

      // Sort classes by start time for each day
      Object.keys(scheduleData).forEach(day => {
        scheduleData[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      });

      setWeeklySchedule(scheduleData);
      setSubjectColors(dynamicSubjectColors);
    } catch (err) {
      console.error('Error loading weekly schedule:', err);
      setError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1);

    const weekDates = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();

  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getClassesForTimeSlot = (day: string, timeSlot: string) => {
    const dayClasses = weeklySchedule[day] || [];
    return dayClasses.filter(cls => cls.startTime === timeSlot);
  };

  const getAttendanceStatusColor = (cls: WeeklyClass) => {
    if (!cls.attendanceSummary) return '#6b7280';

    const { attendancePercentage, isAttendanceCritical } = cls.attendanceSummary;

    if (isAttendanceCritical) return '#ef4444'; // red
    if (attendancePercentage >= 90) return '#10b981'; // green
    if (attendancePercentage >= 75) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const formatAttendancePercentage = (cls: WeeklyClass) => {
    if (!cls.attendanceSummary) return 'N/A';
    return `${cls.attendanceSummary.attendancePercentage.toFixed(1)}%`;
  };

  const renderCalendarView = () => {
    // Calculate overall stats
    const allClasses = Object.values(weeklySchedule).flat();
    const totalClasses = allClasses.reduce((sum, cls) => sum + (cls.attendanceSummary?.totalClasses || 0), 0);
    const totalAttended = allClasses.reduce((sum, cls) => sum + (cls.attendanceSummary?.attendedClasses || 0), 0);
    const overallPercentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
    const criticalClasses = allClasses.filter(cls => cls.attendanceSummary?.isAttendanceCritical).length;

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Week Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-bold text-gray-800">
              Week of {formatDate(weekDates[0])} - {formatDate(weekDates[5])}
            </Text>
            <TouchableOpacity
              onPress={() => {
                // Get the first classroom ID from the schedule
                const firstClassroom = Object.values(weeklySchedule).flat()[0];
                if (firstClassroom) {
                  setEditingClassroomId(firstClassroom.classroomId);
                  setShowEditModal(true);
                }
              }}
              className="bg-blue-500 px-3 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="pencil" size={16} color="white" />
                <Text className="text-white font-medium ml-1">Edit</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View className="flex-row">
            <View className="w-16" />
            {DAYS_OF_WEEK.map((day, index) => {
              const dayClasses = weeklySchedule[day] || [];
              const hasClasses = dayClasses.length > 0;
              return (
                <TouchableOpacity
                  key={day}
                  className="flex-1 items-center py-2 rounded-lg"
                  onPress={() => hasClasses && setSelectedDay(day)}
                  activeOpacity={hasClasses ? 0.7 : 1}
                  style={{
                    backgroundColor: hasClasses ? '#f3f4f6' : 'transparent'
                  }}
                >
                  <Text className="text-sm font-medium text-gray-600">{day.substring(0, 3)}</Text>
                  <Text className="text-lg font-bold text-gray-800 mt-1">
                    {formatDate(weekDates[index])}
                  </Text>
                  {hasClasses && (
                    <View className="flex-row mt-1">
                      {dayClasses.slice(0, 3).map((cls, i) => (
                        <View
                          key={i}
                          className="w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: cls.color }}
                        />
                      ))}
                      {dayClasses.length > 3 && (
                        <Text className="text-xs text-gray-500">+{dayClasses.length - 3}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Overall Stats */}
        {allClasses.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">📊 Week Overview</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">{allClasses.length}</Text>
                <Text className="text-gray-600 text-xs">Total Classes</Text>
              </View>
              <View className="items-center">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: overallPercentage >= 75 ? '#10b981' : '#ef4444' }}
                >
                  {overallPercentage.toFixed(1)}%
                </Text>
                <Text className="text-gray-600 text-xs">Attendance</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-red-600">{criticalClasses}</Text>
                <Text className="text-gray-600 text-xs">Critical</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">
                  {allClasses.filter(cls => cls.todayAttendance === 'present').length}
                </Text>
                <Text className="text-gray-600 text-xs">Present Today</Text>
              </View>
            </View>
          </View>
        )}

        {/* Schedule Grid */}
        <ScrollView className="flex-1">
          {TIME_SLOTS.map((timeSlot, timeIndex) => (
            <View key={timeSlot} className="flex-row border-b border-gray-100">
              {/* Time Column */}
              <View className="w-16 p-2 bg-gray-50 border-r border-gray-200 justify-center">
                <Text className="text-xs font-medium text-gray-600 text-center">
                  {timeSlot}
                </Text>
              </View>

              {/* Days Columns */}
              {DAYS_OF_WEEK.map((day) => {
                const classes = getClassesForTimeSlot(day, timeSlot);
                return (
                  <View key={day} className="flex-1 min-h-16 border-r border-gray-100">
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        onPress={() => setSelectedClass(cls)}
                        className="mx-1 my-1 p-2 rounded-lg shadow-sm relative"
                        style={{ backgroundColor: cls.color + '20', borderLeftWidth: 4, borderLeftColor: cls.color }}
                      >
                        <Text className="text-xs font-semibold text-gray-800" numberOfLines={1}>
                          {cls.subject}
                        </Text>
                        <Text className="text-xs text-gray-600" numberOfLines={1}>
                          {cls.location}
                        </Text>

                        {/* Attendance indicator */}
                        {cls.attendanceSummary && (
                          <View className="flex-row items-center justify-between mt-1">
                            <Text
                              className="text-xs font-bold"
                              style={{ color: getAttendanceStatusColor(cls) }}
                            >
                              {formatAttendancePercentage(cls)}
                            </Text>
                            {cls.todayAttendance && (
                              <View
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: cls.todayAttendance === 'present' ? '#10b981' : '#ef4444'
                                }}
                              />
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    );
  };
  const renderClassDetailView = () => {
    if (!selectedClass) return null;

    const { attendanceSummary } = selectedClass;

    return (
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Class Header */}
        <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => setSelectedClass(null)}
              className="flex-row items-center"
            >
              <Ionicons name="chevron-back" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-1">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setEditingClassroomId(selectedClass.classroomId);
                setShowEditModal(true);
              }}
              className="bg-blue-500 px-3 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="pencil" size={16} color="white" />
                <Text className="text-white font-medium ml-1">Edit</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-start">
            <View
              className="w-1 h-16 rounded-full mr-4"
              style={{ backgroundColor: selectedClass.color }}
            />
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800 mb-1">
                {selectedClass.subject}
              </Text>
              <Text className="text-lg text-gray-600 mb-2">
                {selectedClass.day} • {selectedClass.startTime} - {selectedClass.endTime}
              </Text>

              <View className="flex-row items-center mb-2">
                <Ionicons name="person-outline" size={16} color="#6b7280" />
                <Text className="text-gray-600 ml-2">{selectedClass.instructor}</Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={16} color="#6b7280" />
                <Text className="text-gray-600 ml-2">{selectedClass.location}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Attendance Analytics */}
        {attendanceSummary && (
          <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
            <Text className="text-xl font-bold text-gray-800 mb-4">📊 Attendance Analytics</Text>

            {/* Current Stats */}
            <View className="flex-row justify-between mb-6">
              <View className="flex-1 items-center">
                <Text
                  className="text-3xl font-bold"
                  style={{ color: getAttendanceStatusColor(selectedClass) }}
                >
                  {attendanceSummary.attendancePercentage.toFixed(1)}%
                </Text>
                <Text className="text-gray-600 text-sm text-center">Current Attendance</Text>
              </View>

              <View className="flex-1 items-center">
                <Text className="text-3xl font-bold text-blue-600">
                  {attendanceSummary.attendedClasses}/{attendanceSummary.totalClasses}
                </Text>
                <Text className="text-gray-600 text-sm text-center">Classes Attended</Text>
              </View>

              <View className="flex-1 items-center">
                <Text className="text-3xl font-bold text-purple-600">
                  {attendanceSummary.requiredAttendancePercentage}%
                </Text>
                <Text className="text-gray-600 text-sm text-center">Required</Text>
              </View>
            </View>

            {/* Attendance Status */}
            {attendanceSummary.isAttendanceCritical ? (
              <View className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={24} color="#dc2626" />
                  <Text className="text-red-700 font-bold ml-2 text-lg">Attendance Critical!</Text>
                </View>
                <Text className="text-red-600 mt-2">
                  Your attendance is below the required {attendanceSummary.requiredAttendancePercentage}% threshold.
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
            <View className="space-y-3">
              <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-green-500 w-4 h-4 rounded-full mr-3"></View>
                  <Text className="text-gray-700 font-medium">Classes to attend</Text>
                </View>
                <Text className="text-green-600 font-bold text-xl">{attendanceSummary.classesToAttend}</Text>
              </View>

              <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-orange-500 w-4 h-4 rounded-full mr-3"></View>
                  <Text className="text-gray-700 font-medium">Classes you can skip</Text>
                </View>
                <Text className="text-orange-600 font-bold text-xl">{attendanceSummary.classesCanSkip}</Text>
              </View>

              <View className="flex-row items-center justify-between bg-gray-50 rounded-lg p-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-red-500 w-4 h-4 rounded-full mr-3"></View>
                  <Text className="text-gray-700 font-medium">Classes missed</Text>
                </View>
                <Text className="text-red-600 font-bold text-xl">{attendanceSummary.absentClasses}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Today's Status */}
        {selectedClass.todayAttendance && (
          <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
            <Text className="text-xl font-bold text-gray-800 mb-4">📅 Today's Status</Text>
            <View
              className="flex-row items-center p-4 rounded-lg"
              style={{
                backgroundColor: selectedClass.todayAttendance === 'present' ? '#dcfce7' : '#fee2e2'
              }}
            >
              <Ionicons
                name={selectedClass.todayAttendance === 'present' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={selectedClass.todayAttendance === 'present' ? '#16a34a' : '#dc2626'}
              />
              <Text
                className="ml-3 font-bold text-lg"
                style={{
                  color: selectedClass.todayAttendance === 'present' ? '#16a34a' : '#dc2626'
                }}
              >
                {selectedClass.todayAttendance === 'present' ? 'Present' : 'Absent'}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="bg-white rounded-2xl p-6 border border-gray-100">
          <Text className="text-xl font-bold text-gray-800 mb-4">⚡ Quick Actions</Text>
          <TouchableOpacity
            className="bg-green-500 p-4 rounded-lg mb-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="calendar-outline" size={20} color="white" />
              <Text className="text-white font-bold ml-2">View Full History</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-500 p-4 rounded-lg"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="stats-chart-outline" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Generate Report</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderDayView = () => {
    const dayClasses = weeklySchedule[selectedDay!] || [];
    const dayIndex = DAYS_OF_WEEK.indexOf(selectedDay!);
    const dayDate = weekDates[dayIndex];

    return (
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Day Header */}
        <View className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-2">
            <TouchableOpacity
              onPress={() => setSelectedDay(null)}
              className="flex-row items-center"
            >
              <Ionicons name="chevron-back" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-1">Back to Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const firstClass = dayClasses[0];
                if (firstClass) {
                  setEditingClassroomId(firstClass.classroomId);
                  setShowEditModal(true);
                }
              }}
              className="bg-blue-500 px-3 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons name="pencil" size={16} color="white" />
                <Text className="text-white font-medium ml-1">Edit</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-800">{selectedDay}</Text>
          <Text className="text-lg text-gray-600">{formatDate(dayDate)}</Text>

          {/* Day Summary */}
          {dayClasses.length > 0 && (
            <View className="mt-4 pt-4 border-t border-gray-100">
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-blue-600">{dayClasses.length}</Text>
                  <Text className="text-gray-600 text-sm">Classes</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-green-600">
                    {dayClasses.filter(cls => cls.todayAttendance === 'present').length}
                  </Text>
                  <Text className="text-gray-600 text-sm">Present</Text>
                </View>
                <View className="items-center">
                  <Text className="text-2xl font-bold text-red-600">
                    {dayClasses.filter(cls => cls.todayAttendance === 'absent').length}
                  </Text>
                  <Text className="text-gray-600 text-sm">Absent</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Classes List */}
        {dayClasses.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="text-lg font-semibold text-gray-800 mb-2">No Classes Today</Text>
            <Text className="text-gray-600 text-center">
              Enjoy your free day or use it for self-study!
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {dayClasses
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((cls, index) => (
                <TouchableOpacity
                  key={cls.id}
                  onPress={() => setSelectedClass(cls)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start">
                    <View
                      className="w-1 h-full rounded-full mr-4"
                      style={{ backgroundColor: cls.color }}
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-lg font-bold text-gray-800">
                          {cls.subject}
                        </Text>
                        <View className="bg-gray-100 px-3 py-1 rounded-full">
                          <Text className="text-sm font-medium text-gray-600">
                            {cls.startTime} - {cls.endTime}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mb-2">
                        <Ionicons name="person-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">{cls.instructor}</Text>
                      </View>

                      <View className="flex-row items-center mb-3">
                        <Ionicons name="location-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-600 ml-2">{cls.location}</Text>
                      </View>

                      {/* Attendance Info */}
                      {cls.attendanceSummary && (
                        <View className="bg-gray-50 rounded-lg p-3">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-sm font-medium text-gray-700">Attendance</Text>
                            <Text
                              className="text-sm font-bold"
                              style={{ color: getAttendanceStatusColor(cls) }}
                            >
                              {formatAttendancePercentage(cls)}
                            </Text>
                          </View>

                          <View className="flex-row justify-between text-xs">
                            <Text className="text-gray-600">
                              {cls.attendanceSummary.attendedClasses}/{cls.attendanceSummary.totalClasses} classes
                            </Text>
                            {cls.todayAttendance && (
                              <View className="flex-row items-center">
                                <View
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{
                                    backgroundColor: cls.todayAttendance === 'present' ? '#10b981' : '#ef4444'
                                  }}
                                />
                                <Text
                                  className="text-xs font-medium"
                                  style={{
                                    color: cls.todayAttendance === 'present' ? '#10b981' : '#ef4444'
                                  }}
                                >
                                  {cls.todayAttendance === 'present' ? 'Present' : 'Absent'}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ScheduleSkeleton />
      </Modal>
    );
  }

  // Show error state
  if (error) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-center items-center px-6 bg-gray-50">
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4 text-center">
            Unable to Load Schedule
          </Text>
          <Text className="text-gray-600 mt-2 text-center">{error}</Text>
          <TouchableOpacity
            onPress={loadWeeklySchedule}
            className="bg-green-500 px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            className="mt-4"
          >
            <Text className="text-gray-600">Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-gray-50">
          {/* Header */}
          <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">📅</Text>
                <Text className="text-xl font-bold text-gray-800">
                  {selectedClass ? selectedClass.subject :
                    selectedDay ? `${selectedDay} Schedule` : 'Weekly Schedule'}
                </Text>
              </View>
              <View className="flex-row items-center space-x-2">
                {!selectedClass && !selectedDay && (
                  <TouchableOpacity
                    onPress={loadWeeklySchedule}
                    className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2"
                  >
                    <Ionicons name="refresh" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Content */}
          {selectedClass ? renderClassDetailView() :
            selectedDay ? renderDayView() : renderCalendarView()}

          {/* Legend */}
          {!selectedDay && !selectedClass && Object.keys(subjectColors).length > 0 && (
            <View className="bg-white border-t border-gray-200 p-4">
              <Text className="text-sm font-medium text-gray-700 mb-3">Subjects</Text>
              <View className="flex-row flex-wrap mb-3">
                {Object.entries(subjectColors).slice(0, 8).map(([name, color]) => (
                  <View key={name} className="flex-row items-center mr-4 mb-2">
                    <View
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    <Text className="text-xs text-gray-600">{name}</Text>
                  </View>
                ))}
                {Object.keys(subjectColors).length > 8 && (
                  <Text className="text-xs text-gray-500 mt-1">
                    +{Object.keys(subjectColors).length - 8} more subjects
                  </Text>
                )}
              </View>
              
            </View>
          )}
        </View>
      </Modal>

      {/* Schedule Edit Modal */}
      {editingClassroomId && (
        <ScheduleEditModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingClassroomId(null);
          }}
          classroomId={editingClassroomId}
          userId={userId}
          onScheduleUpdated={() => {
            loadWeeklySchedule(); // Refresh the schedule data
          }}
        />
      )}
    </>
  );
};