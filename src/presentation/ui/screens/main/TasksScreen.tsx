import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { User } from '../../../../domain/model/User';
import { useTasks } from '../../../hooks/useTasks';
import { AddTaskModal } from '../../components/AddTaskModal';
import { TasksSkeleton } from '../../components/skeletons/TasksSkeleton';

interface TasksScreenProps {
  user: User;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ user }) => {
  console.log('📱 TasksScreen: user =', user);
  console.log('📱 TasksScreen: user.id =', user?.id);

  const {
    tasks,
    loading,
    error,
    toggleTask,
    deleteTask,
    createTask,
    updateTask,
    completedTasks,
    pendingTasks,
    progressPercentage,
  } = useTasks(user?.id || null);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all', // 'all', 'pending', 'completed'
    priority: 'all', // 'all', 'High', 'Medium', 'Low'
    subject: 'all', // 'all' or specific subject
  });



  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleTask(taskId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSubmitTask = async (taskData: any) => {
    try {
      if (editingTask) {
        // Update existing task
        await updateTask(editingTask.id, taskData);
      } else {
        // Create new task
        await createTask(taskData);
      }
    } catch (error) {
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowAddTaskModal(true);
  };

  const handleCloseModal = () => {
    setShowAddTaskModal(false);
    setEditingTask(null);
  };

  // Filter tasks based on active filters
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (activeFilters.status === 'pending' && task.completed) return false;
    if (activeFilters.status === 'completed' && !task.completed) return false;

    // Priority filter
    if (activeFilters.priority !== 'all' && task.priority !== activeFilters.priority) return false;

    // Subject filter
    if (activeFilters.subject !== 'all' && task.subject !== activeFilters.subject) return false;

    return true;
  });

  // Get unique subjects for filter options
  const uniqueSubjects = [...new Set(tasks.map(task => task.subject))];

  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      status: 'all',
      priority: 'all',
      subject: 'all',
    });
  };

  const hasActiveFilters = activeFilters.status !== 'all' ||
    activeFilters.priority !== 'all' ||
    activeFilters.subject !== 'all';

  if (loading) {
    return <TasksSkeleton />;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>


        <View className="px-6 py-6">
          {/* Progress Overview */}
          <View className="bg-white rounded-3xl p-6 mb-4 mt-9 border border-gray-100">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              📊 Progress Overview
            </Text>

            <View className="flex-row justify-between mb-6">
              <View className="items-center flex-1">
                <View className="bg-green-50 p-4 rounded-3xl mb-2 border border-green-100">
                  <Text className="text-2xl font-bold text-green-600">   {completedTasks}   </Text>
                </View>
                <Text className="text-gray-600 font-medium">Completed</Text>
              </View>

              <View className="items-center flex-1">
                <View className="bg-orange-50 p-4 rounded-3xl mb-2 border border-orange-100">
                  <Text className="text-2xl font-bold text-orange-600">   {pendingTasks}   </Text>
                </View>
                <Text className="text-gray-600 font-medium">Pending</Text>
              </View>

              <View className="items-center flex-1">
                <View className="bg-blue-50 p-4 rounded-3xl mb-2 border border-blue-100">
                  <Text className="text-2xl font-bold text-blue-600">{progressPercentage}%</Text>
                </View>
                <Text className="text-gray-600 font-medium">Progress</Text>
              </View>
            </View>

            <View className="bg-gray-200 rounded-full h-3">
              <View
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row mb-6 space-x-4 ml-2 mr-2">
            <TouchableOpacity
              className="flex-1 bg-green-500 p-4 rounded-2xl m-1"
              onPress={() => setShowAddTaskModal(true)}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
                <Text className="text-white font-semibold ml-2">Add Task</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white p-4 rounded-2xl m-1 border border-gray-200"
              onPress={() => setShowFilterModal(true)}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="filter-outline" size={20} color="#6b7280" />
                <Text className="text-gray-700 font-semibold ml-2">Filter</Text>
                {hasActiveFilters && (
                  <View className="bg-green-500 w-2 h-2 rounded-full ml-1" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Active Filters */}
          {hasActiveFilters && (
            <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-blue-800 font-medium mb-1">Active Filters:</Text>
                  <View className="flex-row flex-wrap">
                    {activeFilters.status !== 'all' && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-blue-800 text-xs font-medium">
                          Status: {activeFilters.status}
                        </Text>
                      </View>
                    )}
                    {activeFilters.priority !== 'all' && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-blue-800 text-xs font-medium">
                          Priority: {activeFilters.priority}
                        </Text>
                      </View>
                    )}
                    {activeFilters.subject !== 'all' && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-blue-800 text-xs font-medium">
                          Subject: {activeFilters.subject}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text className="text-blue-600 font-medium">Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <Text className="text-red-600 font-medium">⚠️ {error}</Text>
            </View>
          )}

          {/* Tasks List */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              📝 Your Tasks
            </Text>
            {filteredTasks.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 border border-gray-100 items-center">
                <Ionicons name="clipboard-outline" size={48} color="#d1d5db" />
                <Text className="text-gray-500 text-lg font-medium mt-4 mb-2">
                  {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                </Text>
                <Text className="text-gray-400 text-center">
                  {tasks.length === 0
                    ? 'Tap "Add Task" to create your first task'
                    : 'Try adjusting your filters or clear them'
                  }
                </Text>
              </View>
            ) : (
              <View className="space-y-4">
                {filteredTasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    className={`bg-white rounded-3xl p-6 border mb-2 border-gray-100 ${task.completed ? 'opacity-70' : ''}`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start mb-4">
                      <TouchableOpacity
                        onPress={() => handleToggleTask(task.id)}
                        className="mr-4 mt-1"
                      >
                        <Ionicons
                          name={task.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
                          size={24}
                          color={task.completed ? '#10b981' : '#d1d5db'}
                        />
                      </TouchableOpacity>

                      <View className="flex-1">
                        <View className="flex-row items-center mb-2">
                          <View
                            className="px-2 py-1 rounded-full mr-2"
                            style={{ backgroundColor: getPriorityColor(task.priority) + '20' }}
                          >
                            <Text
                              className="text-xs font-semibold"
                              style={{ color: getPriorityColor(task.priority) }}
                            >
                              {task.priority}
                            </Text>
                          </View>
                          <View className="bg-gray-100 px-2 py-1 rounded-full">
                            <Text className="text-xs font-semibold text-gray-700">
                              {task.subject}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className={`text-lg font-bold mb-2 ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                            }`}
                        >
                          {task.title}
                        </Text>

                        <Text className="text-gray-600 text-sm mb-3">
                          {task.description}
                        </Text>

                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={16} color="#6b7280" />
                          <Text className="text-gray-600 text-sm ml-1">
                            Due: {task.dueDate}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        className="p-2"
                        onPress={() => handleDeleteTask(task.id)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    {!task.completed && (
                      <View className="flex-row space-x-3">
                        <TouchableOpacity
                          className="flex-1 bg-gray-50 py-3 rounded-xl m-1"
                          onPress={() => handleEditTask(task)}
                        >
                          <Text className="text-center font-semibold text-gray-700">
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 py-3 rounded-xl m-1"
                          style={{ backgroundColor: task.color }}
                          onPress={() => handleToggleTask(task.id)}
                        >
                          <Text className="text-center font-semibold text-white">
                            Mark Done
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Bottom Padding */}
          <View className="h-8" />
        </View>
      </ScrollView>

      {/* Filter Modal */}
      {showFilterModal && (
        <View className="absolute inset-0 bg-opacity-30 justify-center items-center z-50">
          <View className="bg-white rounded-3xl p-6 m-6 w-80 max-h-96">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Filter Tasks</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Status Filter */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Status</Text>
                <View className="flex-row flex-wrap">
                  {['all', 'pending', 'completed'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${activeFilters.status === status
                        ? 'bg-green-500'
                        : 'bg-gray-100'
                        }`}
                      onPress={() => handleFilterChange('status', status)}
                    >
                      <Text className={`font-medium ${activeFilters.status === status
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority Filter */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Priority</Text>
                <View className="flex-row flex-wrap">
                  {['all', 'High', 'Medium', 'Low'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${activeFilters.priority === priority
                        ? 'bg-green-500'
                        : 'bg-gray-100'
                        }`}
                      onPress={() => handleFilterChange('priority', priority)}
                    >
                      <Text className={`font-medium ${activeFilters.priority === priority
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Subject Filter */}
              {uniqueSubjects.length > 0 && (
                <View className="mb-6">
                  <Text className="text-lg font-semibold text-gray-800 mb-3">Subject</Text>
                  <View className="flex-row flex-wrap">
                    <TouchableOpacity
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${activeFilters.subject === 'all'
                        ? 'bg-green-500'
                        : 'bg-gray-100'
                        }`}
                      onPress={() => handleFilterChange('subject', 'all')}
                    >
                      <Text className={`font-medium ${activeFilters.subject === 'all'
                        ? 'text-white'
                        : 'text-gray-700'
                        }`}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {uniqueSubjects.map((subject) => (
                      <TouchableOpacity
                        key={subject}
                        className={`px-4 py-2 rounded-full mr-2 mb-2 ${activeFilters.subject === subject
                          ? 'bg-green-500'
                          : 'bg-gray-100'
                          }`}
                        onPress={() => handleFilterChange('subject', subject)}
                      >
                        <Text className={`font-medium ${activeFilters.subject === subject
                          ? 'text-white'
                          : 'text-gray-700'
                          }`}>
                          {subject}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-gray-100 py-3 rounded-xl"
                onPress={clearAllFilters}
              >
                <Text className="text-center font-semibold text-gray-700">
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-green-500 py-3 rounded-xl"
                onPress={() => setShowFilterModal(false)}
              >
                <Text className="text-center font-semibold text-white">
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        visible={showAddTaskModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTask}
        editingTask={editingTask}
      />
    </View>
  );
};
