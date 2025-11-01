import { Ionicons } from '@expo/vector-icons';
import { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CreateTaskData, Task } from '../../../domain/model/Task';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskData) => Promise<void>;
  editingTask?: Task | null;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  editingTask,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setSubject(editingTask.subject);
      setDescription(editingTask.description || '');
      setDueDate(editingTask.dueDate);
      setPriority(editingTask.priority);
    } else {
      resetForm();
    }
  }, [editingTask, visible]);

  const priorities = [
    { value: 'High' as const, color: '#ef4444', label: 'High Priority' },
    { value: 'Medium' as const, color: '#f59e0b', label: 'Medium Priority' },
    { value: 'Low' as const, color: '#10b981', label: 'Low Priority' },
  ];

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDescription('');
    setDueDate('');
    setPriority('Medium');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }

    if (!dueDate.trim()) {
      Alert.alert('Error', 'Please enter a due date');
      return;
    }

    setLoading(true);
    try {
      const taskData: CreateTaskData = {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        dueDate: dueDate.trim(),
        priority,
        color: priorities.find(p => p.value === priority)?.color || '#f59e0b',
      };

      await onSubmit(taskData);
      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingTask ? 'update' : 'create'} task. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-800">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded-xl ${loading ? 'bg-gray-300' : 'bg-green-500'}`}
            >
              <Text className="text-white font-semibold">
                {loading
                  ? (editingTask ? 'Updating...' : 'Creating...')
                  : (editingTask ? 'Update' : 'Create')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Task Title */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Task Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title..."
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              multiline
            />
          </View>

          {/* Subject */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Subject *</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g., Mathematics, Physics, English..."
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add task details..."
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Due Date */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-2">Due Date *</Text>
            <TouchableOpacity
              onPress={() => {
                const currentDate = dueDate ? new Date(dueDate) : new Date();

                // First show date picker
                DateTimePickerAndroid.open({
                  value: currentDate,
                  onChange: (event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (event.type === 'set' && selectedDate) {
                      // After date is selected, show time picker
                      DateTimePickerAndroid.open({
                        value: selectedDate,
                        onChange: (timeEvent: DateTimePickerEvent, selectedTime?: Date) => {
                          if (timeEvent.type === 'set' && selectedTime) {
                            const formatted = selectedTime.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            });
                            setDueDate(formatted);
                          }
                        },
                        mode: 'time',
                        is24Hour: false,
                      });
                    }
                  },
                  mode: 'date',
                });
              }}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={`${dueDate ? 'text-gray-800' : 'text-gray-400'}`}>
                {dueDate || 'Select due date and time...'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Priority */}
          <View className="mb-6">
            <Text className="text-gray-700 font-semibold mb-3">Priority</Text>
            <View className="space-y-3">
              {priorities.map((priorityOption) => (
                <TouchableOpacity
                  key={priorityOption.value}
                  onPress={() => setPriority(priorityOption.value)}
                  className={`bg-white border rounded-xl m-1 p-4 flex-row items-center ${priority === priorityOption.value ? 'border-green-500' : 'border-gray-200'
                    }`}
                >
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: priorityOption.color }}
                  />
                  <Text className="text-gray-800 font-medium flex-1">
                    {priorityOption.label}
                  </Text>
                  {priority === priorityOption.value && (
                    <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};