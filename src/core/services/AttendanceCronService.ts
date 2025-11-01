import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { NotificationService } from "../../data/services/NotificationClientService";
import { NotificationTemplate } from "../constants/NotificationTemplates";

export interface AttendanceReminderSettings {
  userId: string;
  attendanceReminders: boolean;
  morningMessages: boolean;
  eveningReminderTime: { hour: number; minute: number }; // 5:00 PM
  secondReminderTime: { hour: number; minute: number }; // 7:00 PM
  morningMessageTime: { hour: number; minute: number }; // Random time between 7-9 AM
}

export class AttendanceCronService {
  private static instance: AttendanceCronService;
  private scheduledNotifications: Map<string, string> = new Map();
  private isInitialized = false;
  private currentUserId: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): AttendanceCronService {
    if (!AttendanceCronService.instance) {
      AttendanceCronService.instance = new AttendanceCronService();
    }
    return AttendanceCronService.instance;
  }

  async initialize(userId: string): Promise<void> {
    // If already initializing, wait for that to complete
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    // If already initialized for a different user, cleanup first
    if (this.isInitialized && this.currentUserId !== userId) {
      console.log("Cleaning up previous user's notifications");
      await this.cleanup();
    }

    if (this.isInitialized && this.currentUserId === userId) {
      console.log("Attendance cron service already initialized for this user");
      return;
    }

    // Create initialization promise to prevent concurrent calls
    this.initializationPromise = this.doInitialize(userId);
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async doInitialize(userId: string): Promise<void> {
    try {
      console.log("Initializing attendance cron service for user:", userId);

      // First, cancel any existing notifications to prevent duplicates
      await this.cancelAllAttendanceNotifications();

      // Get or create attendance reminder settings
      const settings = await this.getAttendanceSettings(userId);

      if (settings.attendanceReminders) {
        await this.scheduleAttendanceReminders(userId, settings);
      }

      if (settings.morningMessages) {
        await this.scheduleMorningMessages(userId, settings);
      }

      this.currentUserId = userId;
      this.isInitialized = true;
      console.log("Attendance cron service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize attendance cron service:", error);
      throw error;
    }
  }

  private async getAttendanceSettings(
    userId: string
  ): Promise<AttendanceReminderSettings> {
    try {
      // Note: In a real implementation, you would fetch user settings from Firebase
      // const firebaseService = FirebaseNotificationService.getInstance();
      // const userSettings = await firebaseService.getUserNotificationSettings(userId);

      // Default settings if not found
      const defaultSettings: AttendanceReminderSettings = {
        userId,
        attendanceReminders: true,
        morningMessages: true,
        eveningReminderTime: { hour: 17, minute: 0 }, // 5:00 PM
        secondReminderTime: { hour: 19, minute: 0 }, // 7:00 PM
        morningMessageTime: { hour: 8, minute: 0 }, // Will be randomized
      };

      return defaultSettings;
    } catch (error) {
      console.error("Failed to get attendance settings:", error);
      throw error;
    }
  }

  private async scheduleAttendanceReminders(
    userId: string,
    settings: AttendanceReminderSettings
  ): Promise<void> {
    const notificationService = NotificationService.getInstance();

    try {
      // Cancel any existing attendance notifications first to prevent duplicates
      await this.cancelAllAttendanceNotifications();

      // Schedule first reminder at 5:00 PM
      const firstReminderTemplate = this.getRandomAttendanceReminderTemplate();
      const firstReminderTrigger: Notifications.DailyTriggerInput = {
        hour: settings.eveningReminderTime.hour,
        minute: settings.eveningReminderTime.minute,
        type: SchedulableTriggerInputTypes.DAILY
      };
      const firstReminderId =
        await notificationService.scheduleLocalNotification(
          firstReminderTemplate,
          firstReminderTrigger
        );

      this.scheduledNotifications.set(
        "attendance_first_reminder",
        firstReminderId
      );

      // Schedule second reminder at 7:00 PM
      const secondReminderTemplate = this.getRandomSecondReminderTemplate();
      const secondReminderTrigger: Notifications.DailyTriggerInput = {
        hour: settings.secondReminderTime.hour,
        minute: settings.secondReminderTime.minute,
        type: SchedulableTriggerInputTypes.DAILY
      };
      const secondReminderId =
        await notificationService.scheduleLocalNotification(
          secondReminderTemplate,
          secondReminderTrigger
        );

      this.scheduledNotifications.set(
        "attendance_second_reminder",
        secondReminderId
      );

      console.log("Attendance reminders scheduled successfully");
    } catch (error) {
      console.error("Failed to schedule attendance reminders:", error);
    }
  }

  private async scheduleMorningMessages(
    userId: string,
    settings: AttendanceReminderSettings
  ): Promise<void> {
    const notificationService = NotificationService.getInstance();

    try {
      // Schedule morning message with random time between 7-9 AM
      const randomHour = Math.floor(Math.random() * 3) + 7; // 7, 8, or 9
      const randomMinute = Math.floor(Math.random() * 60); // 0-59 minutes

      const morningTemplate = this.getRandomMorningMessageTemplate();
      const morningTrigger: Notifications.DailyTriggerInput = {
        hour: randomHour,
        minute: randomMinute,
        type: SchedulableTriggerInputTypes.DAILY
      };
      const morningId = await notificationService.scheduleLocalNotification(
        morningTemplate,
        morningTrigger
      );

      this.scheduledNotifications.set("morning_message", morningId);

      console.log(
        `Morning message scheduled at ${randomHour}:${randomMinute
          .toString()
          .padStart(2, "0")}`
      );
    } catch (error) {
      console.error("Failed to schedule morning messages:", error);
    }
  }

  private getRandomAttendanceReminderTemplate(): NotificationTemplate {
    const funnyReminders = [
      {
        title: "🎭 Attendance Drama Time!",
        body: "Hey there! Did you forget to mark your attendance? Your teacher might think you're at home binge-watching Netflix! 😂",
      },
      {
        title: "📚 Study Police Alert!",
        body: "Sir/Madam, your attendance is missing! Are you perhaps playing hooky? 🕵️‍♂️",
      },
      {
        title: "🚨 Attendance SOS!",
        body: "Mark your attendance or your parents might get a call! 'Did you go to college or the mall?' 😅",
      },
      {
        title: "🎪 Class Time, Not Circus Time!",
        body: "Time to mark attendance, not watch the circus! Hurry up, time's ticking! 🤹‍♂️",
      },
      {
        title: "📱 Attendance, Not Stories!",
        body: "Got time to upload Instagram stories but not to mark attendance? Let's set those priorities straight! 📸",
      },
      {
        title: "🍿 Not Movie Intermission!",
        body: "Finished your popcorn? Now mark that attendance too! Your teacher is waiting! 🎬",
      },
      {
        title: "🎮 Game Over, Attendance On!",
        body: "Done with your game match? Time to play the attendance game! High score needed! 🏆",
      },
      {
        title: "☕ Coffee Break & Attendance!",
        body: "Having coffee at the canteen and forgot to mark attendance? Time to multitask! ☕",
      },
      {
        title: "🚗 Mark It From Your Ride!",
        body: "Stuck in traffic? Perfect time to mark your attendance! 🛺",
      },
      {
        title: "🎵 Musical Reminder!",
        body: "'Mark attendance, mark attendance, or you might fail this year!' 🎶",
      },
      {
        title: "🏏 Attendance Match, Not Cricket!",
        body: "Got time to watch sports but not mark attendance? Check your priorities! 🏏",
      },
      {
        title: "🍕 Ordered Pizza, Forgot Attendance?",
        body: "You're tracking your food delivery but not tracking your attendance? 🍕",
      },
      {
        title: "📺 Watching Shows or Attendance?",
        body: "Waiting for the next episode of your favorite show? Mark attendance first! 📺",
      },
      {
        title: "🛒 Add Attendance to Your List!",
        body: "Adding items to your online cart but forgot to add your name to attendance? 🛒",
      },
      {
        title: "🎂 Attendance Day, Not Birthday!",
        body: "Sending birthday wishes on social media? First wish yourself good attendance! 🎂",
      },
    ];

    const randomIndex = Math.floor(Math.random() * funnyReminders.length);
    const reminder = funnyReminders[randomIndex];

    return {
      id: "attendance_reminder_first",
      title: reminder.title,
      body: reminder.body,
      data: {
        type: "attendance_reminder",
        reminderType: "first",
        timestamp: new Date().toISOString(),
      },
      priority: "high",
      sound: "default",
      badge: 1,
    };
  }

  private getRandomSecondReminderTemplate(): NotificationTemplate {
    const urgentReminders = [
      {
        title: "🚨 Last Warning!",
        body: "It's 7:00 PM! You really need to mark that attendance now, or you'll have to explain to your teacher tomorrow! 😰",
      },
      {
        title: "⏰ Time Up! Attendance Down!",
        body: "Only 30 minutes left! Hurry up and mark it, or you'll miss your chance to say 'Present Sir'! ⏰",
      },
      {
        title: "🔥 Emergency Alert!",
        body: "Mayday! Mayday! Marking attendance is urgent! Your teacher's mood might turn sour! 🚁",
      },
      {
        title: "📢 Final Call!",
        body: "Like the last boarding call at the airport - 'Last call for attendance marking!' ✈️",
      },
      {
        title: "🎯 Don't Miss Your Target!",
        body: "Your attendance percentage will drop! Do you want to maintain that 75% or not? 🎯",
      },
      {
        title: "🚀 Mark It at Rocket Speed!",
        body: "Even NASA doesn't launch rockets this fast! Hurry up! 🚀",
      },
      {
        title: "🏃‍♂️ Become a Marathon Runner!",
        body: "Pick up your phone at lightning speed and mark that attendance! 🏃‍♂️",
      },
      {
        title: "🎪 Last Show of the Circus!",
        body: "The final attendance marking show is running! Book your ticket quickly! 🎪",
      },
      {
        title: "🍕 Faster Than Pizza Delivery!",
        body: "Pizza gets delivered in 30 minutes, you deliver attendance in 2 minutes! 🍕",
      },
      {
        title: "📱 Like a Blue Tick!",
        body: "You've read the message, now mark that attendance too! Put that blue tick! 💙",
      },
    ];

    const randomIndex = Math.floor(Math.random() * urgentReminders.length);
    const reminder = urgentReminders[randomIndex];

    return {
      id: "attendance_reminder_second",
      title: reminder.title,
      body: reminder.body,
      data: {
        type: "attendance_reminder",
        reminderType: "second",
        timestamp: new Date().toISOString(),
      },
      priority: "high",
      sound: "default",
      badge: 1,
    };
  }

  private getRandomMorningMessageTemplate(): NotificationTemplate {
    const morningMessages = [
      {
        title: "🌅 Good Morning Superstar!",
        body: "Rise and shine! Time to make today awesome! Coffee ready? Now mark that attendance! ☕",
      },
      {
        title: "☀️ Early Bird Alert!",
        body: "Early bird gets the worm! And you'll get perfect attendance! Let's start this day right! 🐦",
      },
      {
        title: "🎵 Morning Anthem!",
        body: "'Good morning, good morning, time to mark attendance!' Start your day with a win! 🎶",
      },
      {
        title: "🚀 Mission Attendance Begins!",
        body: "Houston, we have a student! Today's mission: maintain 100% attendance! Ready for takeoff? 🚀",
      },
      {
        title: "☕ Coffee & Motivation!",
        body: "Coffee's hot, motivation's high, and your attendance enthusiasm is through the roof! Let's go! ☕",
      },
      {
        title: "🌟 Shining Star Alert!",
        body: "Today you're the brightest star! Mark that attendance and keep your glow going! ✨",
      },
      {
        title: "🎯 Target Practice Time!",
        body: "Bullseye in archery, full marks in attendance! Aim and fire! 🏹",
      },
      {
        title: "🏆 Champion's Day!",
        body: "Today is your day! Time to climb to the top of the attendance leaderboard! 🥇",
      },
      {
        title: "🎪 Circus Master Ready?",
        body: "You're the ringmaster today! Time to run the attendance show successfully! 🎪",
      },
      {
        title: "📚 Treasure of Knowledge!",
        body: "Forget Aladdin's genie - your attendance is the real magic! Rub that phone and mark it! 🧞‍♂️",
      },
      {
        title: "🍕 Better Than Pizza!",
        body: "Perfect attendance is more satisfying than pizza! Order your daily dose now! 🍕",
      },
      {
        title: "🎮 Game On Mode!",
        body: "Life's most important game - Attendance! Time to beat your high score! 🎮",
      },
      {
        title: "🚗 Road Trip Started!",
        body: "Destination: Perfect Attendance! GPS is set, tank is full, let's roll! 🗺️",
      },
      {
        title: "🎬 Action Scene!",
        body: "'Lights, Camera, Attendance!' Today's blockbuster movie stars YOU having a perfect day! 🎬",
      },
      {
        title: "🏏 Opening Batsman Ready?",
        body: "You're batting on the attendance pitch! Time to score that century! 🏏",
      },
      {
        title: "🎨 Masterpiece Time!",
        body: "Like Leonardo da Vinci, create your attendance masterpiece today! 🎨",
      },
      {
        title: "🚁 Helicopter View!",
        body: "From up here, everything's clear - just need to mark that attendance! 🚁",
      },
      {
        title: "🎪 Magic Show Time!",
        body: "Abracadabra! Make that attendance appear! You've got the real magic! 🎩",
      },
      {
        title: "🍦 Sweeter Than Ice Cream!",
        body: "Perfect attendance tastes sweeter than ice cream! Give it a try! 🍦",
      },
      {
        title: "🎵 DJ Mode Activated!",
        body: "Your attendance is about to drop the beat! DJ mode is ON! 🎧",
      },
    ];

    const randomIndex = Math.floor(Math.random() * morningMessages.length);
    const message = morningMessages[randomIndex];

    return {
      id: "morning_motivation",
      title: message.title,
      body: message.body,
      data: {
        type: "morning_message",
        timestamp: new Date().toISOString(),
      },
      priority: "default",
      sound: "default",
      badge: 0,
    };
  }

  // Method to update attendance reminder settings
  async updateAttendanceSettings(
    userId: string,
    settings: Partial<AttendanceReminderSettings>
  ): Promise<void> {
    try {
      // Cancel existing notifications
      await this.cancelAllAttendanceNotifications();

      // Get current settings and merge with updates
      const currentSettings = await this.getAttendanceSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };

      // Reschedule with new settings
      if (updatedSettings.attendanceReminders) {
        await this.scheduleAttendanceReminders(userId, updatedSettings);
      }

      if (updatedSettings.morningMessages) {
        await this.scheduleMorningMessages(userId, updatedSettings);
      }

      console.log("Attendance settings updated successfully");
    } catch (error) {
      console.error("Failed to update attendance settings:", error);
    }
  }

  // Cancel all attendance-related notifications
  async cancelAllAttendanceNotifications(): Promise<void> {
    try {
      const notificationService = NotificationService.getInstance();

      // Cancel all scheduled notifications (system-wide cleanup)
      await notificationService.cancelAllNotifications();

      // Clear our tracking map
      this.scheduledNotifications.clear();
      console.log("All attendance notifications cancelled");
    } catch (error) {
      console.error("Failed to cancel attendance notifications:", error);
    }
  }

  // Method to manually trigger a test notification
  async sendTestAttendanceReminder(userId: string): Promise<void> {
    try {
      const notificationService = NotificationService.getInstance();
      const testTemplate = this.getRandomAttendanceReminderTemplate();

      await notificationService.scheduleLocalNotification(testTemplate);
      console.log("Test attendance reminder sent");
    } catch (error) {
      console.error("Failed to send test attendance reminder:", error);
    }
  }

  // Method to manually trigger a test morning message
  async sendTestMorningMessage(userId: string): Promise<void> {
    try {
      const notificationService = NotificationService.getInstance();
      const testTemplate = this.getRandomMorningMessageTemplate();

      await notificationService.scheduleLocalNotification(testTemplate);
      console.log("Test morning message sent");
    } catch (error) {
      console.error("Failed to send test morning message:", error);
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    try {
      await this.cancelAllAttendanceNotifications();
      this.isInitialized = false;
      this.currentUserId = null;
      this.initializationPromise = null;
      console.log("Attendance cron service cleaned up");
    } catch (error) {
      console.error("Failed to cleanup attendance cron service:", error);
    }
  }
}
