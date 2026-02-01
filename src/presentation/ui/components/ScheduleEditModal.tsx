import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ClassSchedule, Schedule } from '../../../domain/model/Classroom';
import { ScheduleSkeleton } from './skeletons/ScheduleSkeleton';
import { SkeletonLoader } from './skeletons/SkeletonLoader';

interface ScheduleEditModalProps {
  visible: boolean;
  onClose: () => void;
  classroomId: string;
  userId: string;
  onScheduleUpdated: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

interface ClassFormData {
  id?: string;
  name: string;
  instructor: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}

export const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  visible,
  onClose,
  classroomId,
  userId,
  onScheduleUpdated
}) => {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
    instructor: '',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    location: ''
  });

  useEffect(() => {
    if (visible) {
      loadSchedule();
    }
  }, [visible, classroomId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const { FirebaseClassroomService } = await import('../../../data/services/ClassroomService');
      const classroomService = new FirebaseClassroomService();
      
      const scheduleData = await classroomService.getClassroomSchedule(classroomId);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error loading schedule:', error);
      Alert.alert('Error', 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      instructor: '',
      day: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      location: ''
    });
    setEditingClass(null);
  };

  const handleAddClass = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditClass = (classItem: ClassSchedule) => {
    setFormData({
      id: classItem.id,
      name: classItem.name,
      instructor: classItem.instructor,
      day: classItem.day,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      location: classItem.location
    });
    setEditingClass(classItem);
    setShowAddForm(true);
  };

  const handleDeleteClass = (classItem: ClassSchedule) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete "${classItem.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteClass(classItem.id) }
      ]
    );
  };

  const deleteClass = async (classId: string) => {
    if (!schedule) return;

    try {
      setSaving(true);
      const updatedClasses = schedule.classes.filter(c => c.id !== classId);
      await saveSchedule(updatedClasses);
      
      // Show success message
      Alert.alert('Success', 'Class deleted successfully!');
    } catch (error) {
      console.error('Error deleting class:', error);
      Alert.alert('Error', 'Failed to delete class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Subject name is required');
      return false;
    }
    if (!formData.instructor.trim()) {
      Alert.alert('Error', 'Instructor name is required');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Location is required');
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }

    // Check for time conflicts (excluding current class if editing)
    const existingClasses = schedule?.classes || [];
    const conflictingClass = existingClasses.find(c => 
      c.id !== formData.id && // Exclude current class if editing
      c.day === formData.day &&
      ((formData.startTime >= c.startTime && formData.startTime < c.endTime) ||
       (formData.endTime > c.startTime && formData.endTime <= c.endTime) ||
       (formData.startTime <= c.startTime && formData.endTime >= c.endTime))
    );

    if (conflictingClass) {
      Alert.alert(
        'Time Conflict', 
        `This time slot conflicts with "${conflictingClass.name}" (${conflictingClass.startTime} - ${conflictingClass.endTime})`
      );
      return false;
    }

    return true;
  };

  const handleSaveClass = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const existingClasses = schedule?.classes || [];
      let updatedClasses: ClassSchedule[];

      if (editingClass) {
        // Update existing class
        updatedClasses = existingClasses.map(c => 
          c.id === editingClass.id 
            ? {
                ...c,
                name: formData.name.trim(),
                instructor: formData.instructor.trim(),
                day: formData.day,
                startTime: formData.startTime,
                endTime: formData.endTime,
                location: formData.location.trim()
              }
            : c
        );
      } else {
        // Add new class
        const newClass: ClassSchedule = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Better ID generation
          code: '', // Empty code for now
          subject: formData.name.trim(), // Using name as subject
          name: formData.name.trim(),
          instructor: formData.instructor.trim(),
          day: formData.day,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location.trim()
        };
        updatedClasses = [...existingClasses, newClass];
      }

      await saveSchedule(updatedClasses);
      setShowAddForm(false);
      resetForm();
      
      // Show success message
      Alert.alert(
        'Success', 
        editingClass ? 'Class updated successfully!' : 'Class added successfully!'
      );
    } catch (error) {
      console.error('Error saving class:', error);
      Alert.alert('Error', 'Failed to save class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async (classes: ClassSchedule[]) => {
    const { FirebaseClassroomService } = await import('../../../data/services/ClassroomService');
    const classroomService = new FirebaseClassroomService();

    if (schedule) {
      // Update existing schedule
      const result = await classroomService.updateSchedule(schedule.id, classes);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update schedule');
      }
    } else {
      // Create new schedule
      const result = await classroomService.createSchedule(classroomId, userId, classes);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create schedule');
      }
    }

    await loadSchedule();
    onScheduleUpdated();
  };

  const renderClassForm = () => (
    <Modal
      visible={showAddForm}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAddForm(false)}
    >
      <View className="flex-1 bg-gray-50">
        <View className="bg-white border-b border-gray-200 px-4 py-4 pt-16">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setShowAddForm(false)}
              className="flex-row items-center"
            >
              <Ionicons name="close" size={24} color="#6b7280" />
              <Text className="text-gray-600 ml-2">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">
              {editingClass ? 'Edit Class' : 'Add Class'}
            </Text>
            <TouchableOpacity
              onPress={handleSaveClass}
              disabled={saving}
              className="bg-green-500 px-4 py-2 rounded-lg"
            >
              {saving ? (
                <SkeletonLoader width={20} height={20} borderRadius={10} />
              ) : (
                <Text className="text-white font-medium">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Subject Name */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">Subject Details</Text>
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Subject Name *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Mathematics, Physics, Chemistry"
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
              />
            </View>
            <View>
              <Text className="text-gray-700 font-medium mb-2">Instructor *</Text>
              <TextInput
                value={formData.instructor}
                onChangeText={(text) => setFormData(prev => ({ ...prev, instructor: text }))}
                placeholder="e.g., Dr. Smith, Prof. Johnson"
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
              />
            </View>
          </View>

          {/* Schedule Details */}
          <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">Schedule</Text>
            
            {/* Day Selection */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Day *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row">
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setFormData(prev => ({ ...prev, day }))}
                      className={`px-4 py-2 rounded-lg mr-2 ${
                        formData.day === day ? 'bg-green-500' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={`font-medium ${
                        formData.day === day ? 'text-white' : 'text-gray-700'
                      }`}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-gray-700 font-medium mb-2">Start Time *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    {TIME_OPTIONS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setFormData(prev => ({ ...prev, startTime: time }))}
                        className={`px-3 py-2 rounded-lg mr-1 ${
                          formData.startTime === time ? 'bg-green-500' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          formData.startTime === time ? 'text-white' : 'text-gray-700'
                        }`}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-700 font-medium mb-2">End Time *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row">
                    {TIME_OPTIONS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setFormData(prev => ({ ...prev, endTime: time }))}
                        className={`px-3 py-2 rounded-lg mr-1 ${
                          formData.endTime === time ? 'bg-green-500' : 'bg-gray-100'
                        }`}
                      >
                        <Text className={`text-sm font-medium ${
                          formData.endTime === time ? 'text-white' : 'text-gray-700'
                        }`}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Location */}
            <View>
              <Text className="text-gray-700 font-medium mb-2">Location *</Text>
              <TextInput
                value={formData.location}
                onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                placeholder="e.g., Room 101, Lab A, Online"
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        <View className="bg-white border-b border-gray-200 px-4 py-4 pt-16">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={onClose}
              className="flex-row items-center"
            >
              <Ionicons name="chevron-back" size={24} color="#6b7280" />
              <Text className="text-gray-600 ml-2">Back</Text>
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Edit Schedule</Text>
            <TouchableOpacity
              onPress={handleAddClass}
              className="bg-green-500 px-4 py-2 rounded-lg"
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {schedule && schedule.classes.length > 0 ? (
            <View>
              {DAYS_OF_WEEK.map((day) => {
                const dayClasses = schedule.classes
                  .filter(c => c.day === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                if (dayClasses.length === 0) return null;

                return (
                  <View key={day} className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-3">{day}</Text>
                    <View className="space-y-3">
                      {dayClasses.map((classItem) => (
                        <View
                          key={classItem.id}
                          className="bg-white rounded-2xl p-4 border border-gray-100"
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1">
                              <Text className="text-lg font-bold text-gray-800 mb-1">
                                {classItem.name}
                              </Text>
                              <Text className="text-gray-600 mb-2">
                                {classItem.instructor}
                              </Text>
                              <View className="flex-row items-center mb-1">
                                <Ionicons name="time-outline" size={16} color="#6b7280" />
                                <Text className="text-gray-600 ml-2">
                                  {classItem.startTime} - {classItem.endTime}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Ionicons name="location-outline" size={16} color="#6b7280" />
                                <Text className="text-gray-600 ml-2">
                                  {classItem.location}
                                </Text>
                              </View>
                            </View>
                            <View className="flex-row">
                              <TouchableOpacity
                                onPress={() => handleEditClass(classItem)}
                                className="bg-blue-100 p-2 rounded-lg mr-2"
                              >
                                <Ionicons name="pencil" size={16} color="#3b82f6" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteClass(classItem)}
                                className="bg-red-100 p-2 rounded-lg"
                              >
                                <Ionicons name="trash" size={16} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center border border-gray-100">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="calendar-outline" size={32} color="#9ca3af" />
              </View>
              <Text className="text-lg font-semibold text-gray-800 mb-2">No Classes Yet</Text>
              <Text className="text-gray-500 text-center text-sm leading-5 mb-4">
                Start building your schedule by adding your first class
              </Text>
              <TouchableOpacity
                onPress={handleAddClass}
                className="bg-green-500 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-medium">Add First Class</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {saving && (
          <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
            <View className="bg-white rounded-2xl p-6 items-center">
              <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginBottom: 16 }} />
              <Text className="text-gray-600">Saving changes...</Text>
            </View>
          </View>
        )}
      </View>

      {renderClassForm()}
    </Modal>
  );
};