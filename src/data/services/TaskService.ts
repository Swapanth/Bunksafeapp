import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { CreateTaskData, Task, UpdateTaskData } from "../../domain/model/Task";

export class FirebaseTaskService {
  private readonly COLLECTION_NAME = "tasks";

  // Create a new task
  async createTask(userId: string, taskData: CreateTaskData): Promise<string> {
    try {
      console.log("🔥 FirebaseTaskService: Creating task for user:", userId);
      
      const now = new Date();
      const taskToCreate = {
        ...taskData,
        userId,
        completed: false,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), taskToCreate);
      console.log("✅ Task created successfully with ID:", docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating task:", error);
      throw error;
    }
  }

  // Get all tasks for a user
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      console.log("🔥 FirebaseTaskService: Fetching tasks for user:", userId);
      
      // Validate userId
      if (!userId || userId.trim() === '') {
        console.error("❌ Invalid userId provided:", userId);
        throw new Error("User ID is required and cannot be empty");
      }
      
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const tasks: Task[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          title: data.title,
          subject: data.subject,
          dueDate: data.dueDate,
          priority: data.priority,
          completed: data.completed,
          description: data.description,
          color: data.color,
          userId: data.userId,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (typeof data.createdAt === 'string' ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : new Date()),
        });
      });

      // Sort tasks by creation date (newest first)
      tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log("✅ Fetched", tasks.length, "tasks");
      return tasks;
    } catch (error) {
      console.error("❌ Error fetching tasks:", error);
      throw error;
    }
  }

  // Subscribe to real-time task updates
  subscribeToUserTasks(
    userId: string,
    callback: (tasks: Task[]) => void
  ): () => void {
    console.log("🔥 FirebaseTaskService: Subscribing to tasks for user:", userId);
    
    const q = query(
      collection(db, this.COLLECTION_NAME),
      where("userId", "==", userId)
    );

    return onSnapshot(
      q, 
      (querySnapshot) => {
        const tasks: Task[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          tasks.push({
            id: doc.id,
            title: data.title,
            subject: data.subject,
            dueDate: data.dueDate,
            priority: data.priority,
            completed: data.completed,
            description: data.description,
            color: data.color,
            userId: data.userId,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });

        // Sort tasks by creation date (newest first)
        tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        console.log("🔄 Real-time update: received", tasks.length, "tasks");
        callback(tasks);
      },
      (error) => {
        console.error("❌ Error in tasks subscription:", error);
        // For now, just call callback with empty array
        // In a production app, you'd want to handle this error properly
        callback([]);
      }
    );
  }

  // Update a task
  async updateTask(taskId: string, updates: UpdateTaskData): Promise<void> {
    try {
      console.log("🔥 FirebaseTaskService: Updating task:", taskId);
      
      const taskRef = doc(db, this.COLLECTION_NAME, taskId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(taskRef, updateData);
      console.log("✅ Task updated successfully");
    } catch (error) {
      console.error("❌ Error updating task:", error);
      throw error;
    }
  }

  // Toggle task completion
  async toggleTaskCompletion(taskId: string, completed: boolean): Promise<void> {
    try {
      console.log("🔥 FirebaseTaskService: Toggling task completion:", taskId, completed);
      
      await this.updateTask(taskId, { completed });
    } catch (error) {
      console.error("❌ Error toggling task completion:", error);
      throw error;
    }
  }

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    try {
      console.log("🔥 FirebaseTaskService: Deleting task:", taskId);
      
      const taskRef = doc(db, this.COLLECTION_NAME, taskId);
      await deleteDoc(taskRef);
      
      console.log("✅ Task deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      throw error;
    }
  }
}