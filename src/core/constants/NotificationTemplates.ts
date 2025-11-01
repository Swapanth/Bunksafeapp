export interface NotificationTemplate {
  id: string;
  title: string;
  body: string;
  data?: {
    type?: string;
    reminderType?: string;
    timestamp?: string;
    taskId?: string;
    userId?: string;
    [key: string]: any;
  };
  priority?: "high" | "default" | "low";
  sound?: string;
  badge?: number;
}

export interface TaskNotificationData {
  subject: any;
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate?: string;
  priority?: string;
  userId: string;
  classroomId?: string;
  classroomName?: string;
}

export const NotificationTemplates = {
  TASK_CREATED: (taskData: TaskNotificationData): NotificationTemplate => ({
    id: `task_created_${taskData.taskId}`,
    title: "📝 New Task Created!",
    body: `New task: ${taskData.taskTitle}${taskData.classroomName ? ` in ${taskData.classroomName}` : ''}`,
    data: {
      type: "task_created",
      taskId: taskData.taskId,
      userId: taskData.userId,
      timestamp: new Date().toISOString(),
    },
    priority: "high",
    sound: "default",
    badge: 1,
  }),

  TASK_COMPLETED: (taskData: TaskNotificationData): NotificationTemplate => ({
    id: `task_completed_${taskData.taskId}`,
    title: "✅ Task Completed!",
    body: `Great job! You completed: ${taskData.taskTitle}`,
    data: {
      type: "task_completed",
      taskId: taskData.taskId,
      userId: taskData.userId,
      timestamp: new Date().toISOString(),
    },
    priority: "default",
    sound: "default",
    badge: 0,
  }),

  TASK_DEADLINE_APPROACHING: (taskData: TaskNotificationData): NotificationTemplate => ({
    id: `task_deadline_${taskData.taskId}`,
    title: "⏰ Task Deadline Approaching!",
    body: `Don't forget: ${taskData.taskTitle} is due soon!`,
    data: {
      type: "task_deadline",
      taskId: taskData.taskId,
      userId: taskData.userId,
      dueDate: taskData.dueDate,
      timestamp: new Date().toISOString(),
    },
    priority: "high",
    sound: "default",
    badge: 1,
  }),

  DAILY_TASK_REMINDER: (taskCount: number): NotificationTemplate => ({
    id: "daily_task_reminder",
    title: "📋 Daily Task Reminder",
    body: taskCount > 0 
      ? `You have ${taskCount} pending task${taskCount > 1 ? 's' : ''} to complete today!`
      : "Great job! All your tasks are completed for today! 🎉",
    data: {
      type: "daily_reminder",
      taskCount,
      timestamp: new Date().toISOString(),
    },
    priority: "default",
    sound: "default",
    badge: taskCount,
  }),

  ATTENDANCE_REMINDER: (): NotificationTemplate => ({
    id: "attendance_reminder",
    title: "📅 Attendance Reminder",
    body: "Don't forget to mark your attendance today!",
    data: {
      type: "attendance_reminder",
      timestamp: new Date().toISOString(),
    },
    priority: "high",
    sound: "default",
    badge: 1,
  }),

  FRIEND_REQUEST: (friendName: string): NotificationTemplate => ({
    id: `friend_request_${Date.now()}`,
    title: "👋 New Friend Request",
    body: `${friendName} wants to be your friend!`,
    data: {
      type: "friend_request",
      friendName,
      timestamp: new Date().toISOString(),
    },
    priority: "default",
    sound: "default",
    badge: 1,
  }),

  FRIEND_ACCEPTED: (friendName: string): NotificationTemplate => ({
    id: `friend_accepted_${Date.now()}`,
    title: "🎉 Friend Request Accepted",
    body: `${friendName} accepted your friend request!`,
    data: {
      type: "friend_accepted",
      friendName,
      timestamp: new Date().toISOString(),
    },
    priority: "default",
    sound: "default",
    badge: 0,
  }),

  CLASSROOM_INVITATION: (classroomName: string, inviterName: string): NotificationTemplate => ({
    id: `classroom_invitation_${Date.now()}`,
    title: "🏫 Classroom Invitation",
    body: `${inviterName} invited you to join ${classroomName}`,
    data: {
      type: "classroom_invitation",
      classroomName,
      inviterName,
      timestamp: new Date().toISOString(),
    },
    priority: "high",
    sound: "default",
    badge: 1,
  }),
};
