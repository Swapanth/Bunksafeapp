import { FirebaseClassroomService } from "../../data/services/ClassroomService";
import { FirebaseUserService } from "../../data/services/UserService";
import { Classroom, ClassSchedule, Schedule } from "../model/Classroom";

export interface CreateClassroomData {
  name: string;
  description: string;
  university: string;
  department: string;
  attendanceTarget: number;
}

export interface JoinClassroomData {
  classroomCode: string;
}

export class ClassroomUseCase {
  constructor(
    private classroomService: FirebaseClassroomService = new FirebaseClassroomService(),
    private userService: FirebaseUserService = new FirebaseUserService()
  ) {}

  async createClassroom(
    userId: string,
    data: CreateClassroomData
  ): Promise<{ success: boolean; classroom?: Classroom; error?: string }> {
    try {
      console.log("ClassroomUseCase: Creating classroom for user:", userId);

      const result = await this.classroomService.createClassroom(
        userId,
        data.name,
        data.description,
        data.university,
        data.department,
        data.attendanceTarget
      );

      if (result.success && result.classroom) {
        // Update user profile with classroom ID
        await this.userService.updateUserProfile(userId, {
          classroomId: result.classroom.id,
        });

        console.log("✅ Classroom created and user profile updated");
      }

      return result;
    } catch (error) {
      console.error("Error in createClassroom use case:", error);
      return { success: false, error: "Failed to create classroom" };
    }
  }

  async joinClassroom(
    userId: string,
    data: JoinClassroomData
  ): Promise<{ success: boolean; classroom?: Classroom; error?: string }> {
    try {
      console.log("ClassroomUseCase: Joining classroom for user:", userId);

      // Validate input data
      if (!data.classroomCode || typeof data.classroomCode !== 'string') {
        return { success: false, error: "Classroom code is required" };
      }

      const trimmedCode = data.classroomCode.trim();
      if (!/^\d{6}$/.test(trimmedCode)) {
        return { success: false, error: "Please enter a valid 6-digit classroom code" };
      }

      const result = await this.classroomService.joinClassroom(
        userId,
        trimmedCode
      );

      if (result.success && result.classroom) {
        // Update user profile with classroom ID
        await this.userService.updateUserProfile(userId, {
          classroomId: result.classroom.id,
        });

        console.log("✅ Joined classroom and user profile updated");
      }

      return result;
    } catch (error) {
      console.error("Error in joinClassroom use case:", error);
      return { success: false, error: "Failed to join classroom" };
    }
  }

  async createSchedule(
    userId: string,
    classroomId: string,
    classes: ClassSchedule[],
    semesterStartDate?: string,
    semesterEndDate?: string
  ): Promise<{ success: boolean; schedule?: Schedule; error?: string }> {
    try {
      console.log("ClassroomUseCase: Creating schedule for classroom:", classroomId);

      // Verify user is a member of the classroom
      const classroom = await this.classroomService.getClassroom(classroomId);
      if (!classroom || !classroom.members.includes(userId)) {
        return { success: false, error: "You are not a member of this classroom" };
      }

      const result = await this.classroomService.createSchedule(
        classroomId,
        userId,
        classes,
        semesterStartDate,
        semesterEndDate
      );

      return result;
    } catch (error) {
      console.error("Error in createSchedule use case:", error);
      return { success: false, error: "Failed to create schedule" };
    }
  }

  async getUserClassrooms(userId: string): Promise<Classroom[]> {
    try {
      return await this.classroomService.getUserClassrooms(userId);
    } catch (error) {
      console.error("Error getting user classrooms:", error);
      return [];
    }
  }

  async getClassroomSchedule(classroomId: string): Promise<Schedule | null> {
    try {
      return await this.classroomService.getClassroomSchedule(classroomId);
    } catch (error) {
      console.error("Error getting classroom schedule:", error);
      return null;
    }
  }
}