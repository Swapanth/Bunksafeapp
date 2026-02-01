import { useEffect, useState } from 'react';
import { CreateTaskData, Task, UpdateTaskData } from '../../domain/model/Task';
import { TaskUseCase } from '../../domain/usecase/TaskUseCase';

export interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (taskData: CreateTaskData) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskData) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completedTasks: number;
  pendingTasks: number;
  progressPercentage: number;
}

export const useTasks = (userId: string | null): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskUseCase] = useState(() => new TaskUseCase());

  useEffect(() => {
    console.log('🔍 useTasks: userId =', userId);
    
    if (!userId) {
      console.log('⚠️ useTasks: No userId provided');
      setTasks([]);
      setLoading(false);
      return;
    }

    console.log('🔄 useTasks: Setting up subscription for user:', userId);
    setLoading(true);
    setError(null);

    // Subscribe to real-time updates
    const unsubscribe = taskUseCase.subscribeToUserTasks(
      userId,
      (updatedTasks) => {
        setTasks(updatedTasks);
        setLoading(false);
        setError(null);
      }
    );

    // Handle subscription errors
    const handleError = (error: any) => {
      console.error('❌ Tasks subscription error:', error);
      setLoading(false);
      if (error?.code === 'permission-denied') {
        setError('Permission denied. Please check your authentication.');
      } else {
        setError('Failed to load tasks. Please try again.');
      }
    };

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [userId, taskUseCase]);

  const createTask = async (taskData: CreateTaskData): Promise<void> => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await taskUseCase.createTask(userId, taskData);
      // Real-time listener will update the tasks automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (taskId: string, updates: UpdateTaskData): Promise<void> => {
    try {
      setError(null);
      await taskUseCase.updateTask(taskId, updates);
      // Real-time listener will update the tasks automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleTask = async (taskId: string): Promise<void> => {
    try {
      setError(null);
      const task = tasks.find(t => t.id === taskId);
      if (task && userId) {
        await taskUseCase.toggleTaskCompletion(taskId, !task.completed, userId);
        // Real-time listener will update the tasks automatically
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    try {
      setError(null);
      await taskUseCase.deleteTask(taskId);
      // Real-time listener will update the tasks automatically
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete task';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Computed values
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = tasks.filter(task => !task.completed).length;
  const progressPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    completedTasks,
    pendingTasks,
    progressPercentage,
  };
};