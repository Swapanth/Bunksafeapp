import { useCallback, useEffect, useState } from "react";
import {
    AttendanceCronService,
    AttendanceReminderSettings,
} from "../../core/services/AttendanceCronService";

export interface UseAttendanceRemindersReturn {
  settings: AttendanceReminderSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (
    newSettings: Partial<AttendanceReminderSettings>
  ) => Promise<void>;
  sendTestAttendanceReminder: () => Promise<void>;
  sendTestMorningMessage: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export const useAttendanceReminders = (
  userId: string
): UseAttendanceRemindersReturn => {
  const [settings, setSettings] = useState<AttendanceReminderSettings | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attendanceCronService = AttendanceCronService.getInstance();

  const loadSettings = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // Cancel any existing notifications first to prevent duplicates
      await attendanceCronService.cancelAllAttendanceNotifications();
      
      // Since we don't have a direct method to get settings, we'll use default settings
      // In a real implementation, you'd want to store these in Firebase
      const defaultSettings: AttendanceReminderSettings = {
        userId,
        attendanceReminders: true,
        morningMessages: true,
        eveningReminderTime: { hour: 17, minute: 0 },
        secondReminderTime: { hour: 19, minute: 0 },
        morningMessageTime: { hour: 8, minute: 0 },
      };

      setSettings(defaultSettings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
      console.error("Failed to load attendance reminder settings:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, attendanceCronService]);

  const updateSettings = useCallback(
    async (newSettings: Partial<AttendanceReminderSettings>) => {
      if (!userId || !settings) return;

      setLoading(true);
      setError(null);

      try {
        const updatedSettings = { ...settings, ...newSettings };
        await attendanceCronService.updateAttendanceSettings(
          userId,
          updatedSettings
        );
        setSettings(updatedSettings);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update settings"
        );
        console.error("Failed to update attendance reminder settings:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, settings, attendanceCronService]
  );

  const sendTestAttendanceReminder = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      await attendanceCronService.sendTestAttendanceReminder(userId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send test reminder"
      );
      console.error("Failed to send test attendance reminder:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, attendanceCronService]);

  const sendTestMorningMessage = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      await attendanceCronService.sendTestMorningMessage(userId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send test message"
      );
      console.error("Failed to send test morning message:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, attendanceCronService]);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    sendTestAttendanceReminder,
    sendTestMorningMessage,
    refreshSettings,
  };
};
