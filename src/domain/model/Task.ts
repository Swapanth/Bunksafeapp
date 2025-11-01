export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  description: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskData {
  title: string;
  subject: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  color: string;
}

export interface UpdateTaskData {
  title?: string;
  subject?: string;
  dueDate?: string;
  priority?: 'High' | 'Medium' | 'Low';
  description?: string;
  color?: string;
  completed?: boolean;
}