import { FirebaseNotificationService } from "../../data/services/NotificationBackendService";
import { NotificationService } from "../../data/services/NotificationClientService";
import { FirebaseTaskService } from "../../data/services/TaskService";
import { CreateTaskData, Task, UpdateTaskData } from "../model/Task";

export class TaskUseCase {
  constructor(
    private taskService: FirebaseTaskService = new FirebaseTaskService(),
    private notificationService: NotificationService = NotificationService.getInstance(),
    private firebaseNotificationService: FirebaseNotificationService = FirebaseNotificationService.getInstance()
  ) {}

  async createTask(userId: string, taskData: CreateTaskData): Promise<string> {
    // Validate task data
    if (!taskData.title.trim()) {
      throw new Error("Task title is required");
    }
    
    if (!taskData.subject.trim()) {
      throw new Error("Task subject is required");
    }

    if (!taskData.dueDate.trim()) {
      throw new Error("Task due date is required");
    }

    const taskId = await this.taskService.createTask(userId, taskData);

    // Trigger task created notification
    try {
      const notificationData: TaskNotificationData = {
        taskId,
        taskTitle: taskData.title,
        subject: taskData.subject,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        userId,
      };

      // Send local notification
      await this.notificationService.notifyTaskCreated(notificationData);
      
      // Save to Firebase and send push notification if enabled
      await this.firebaseNotificationService.triggerTaskCreatedNotification(userId, notificationData);

      // Schedule deadline reminder (24 hours before due date)
      const dueDate = new Date(taskData.dueDate);
      const reminderDate = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
      
      if (reminderDate > new Date()) {
        await this.notificationService.scheduleDeadlineReminder(notificationData, reminderDate);
        await this.firebaseNotificationService.scheduleDeadlineReminder(userId, notificationData, reminderDate);
      }
    } catch (error) {
      console.error('Failed to send task created notification:', error);
      // Don't fail task creation if notification fails
    }

    return taskId;
  }

  async getUserTasks(userId: string): Promise<Task[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return await this.taskService.getUserTasks(userId);
  }

  subscribeToUserTasks(
    userId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    if (!userId) {
      throw new Error("User ID is required");
    }

    return this.taskService.subscribeToUserTasks(userId, callback);
  }

  async updateTask(taskId: string, updates: UpdateTaskData): Promise<void> {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    return await this.taskService.updateTask(taskId, updates);
  }

  async toggleTaskCompletion(taskId: string, completed: boolean, userId?: string): Promise<void> {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    await this.taskService.toggleTaskCompletion(taskId, completed);

    // If task is being marked as completed, send completion notification
    if (completed && userId) {
      try {
        // Get task details for notification - only if we have a valid userId
        if (userId.trim()) {
          const tasks = await this.taskService.getUserTasks(userId);
          const task = tasks.find(t => t.id === taskId);
          
          if (task) {
            const notificationData: TaskNotificationData = {
              taskId: task.id,
              taskTitle: task.title,
              subject: task.subject,
              dueDate: task.dueDate,
              priority: task.priority,
              userId: task.userId,
            };

            // Send local notification
            await this.notificationService.notifyTaskCompleted(notificationData);
            
            // Save to Firebase and send push notification if enabled
            await this.firebaseNotificationService.triggerTaskCompletedNotification(task.userId, notificationData);
          }
        } else {
          console.warn('Cannot send task completion notification: userId is empty');
        }
      } catch (error) {
        console.error('Failed to send task completed notification:', error);
        // Don't fail task completion if notification fails
      }
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    return await this.taskService.deleteTask(taskId);
  }

  // Utility methods
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  }

  getDefaultTaskColor(priority: string): string {
    return this.getPriorityColor(priority);
  }
}