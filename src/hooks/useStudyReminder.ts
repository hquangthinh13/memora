import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  formatReminderTime,
  getNotificationPermissionStatus,
  loadReminderSettings,
  reconcileReminderSchedule,
  requestNotificationPermission,
  rescheduleDailyStudyReminder,
  saveReminderSettings,
  type NotificationPermissionStatus,
  type StudyReminderSettings,
} from "@/services/studyReminders";

const PRESETS = {
  morning: { hour: 9, minute: 0 },
  afternoon: { hour: 14, minute: 0 },
  evening: { hour: 19, minute: 0 },
} as const;

export function useStudyReminder() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StudyReminderSettings | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>("undetermined");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [permission, nextSettings] = await Promise.all([
        getNotificationPermissionStatus(),
        loadReminderSettings(user.id),
      ]);
      setPermissionStatus(permission);
      setSettings(nextSettings);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load reminders.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestPermission = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
      return status;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not request permission.");
      return permissionStatus;
    } finally {
      setSaving(false);
    }
  }, [permissionStatus]);

  const toggleEnabled = useCallback(
    async (enabled: boolean) => {
      if (!user || !settings) return;

      setSaving(true);
      setError(null);
      try {
        let status = permissionStatus;
        if (enabled && status !== "granted") {
          status = await requestNotificationPermission();
          setPermissionStatus(status);
        }

        if (enabled && status !== "granted") {
          setSettings((prev) =>
            prev
              ? {
                  ...prev,
                  study_reminder_enabled: false,
                }
              : prev,
          );
          return;
        }

        if (!enabled) {
          const next = {
            ...settings,
            study_reminder_enabled: false,
            study_reminder_notification_id: null,
          };
          await saveReminderSettings(user.id, next);
          const reconciled = await reconcileReminderSchedule(user.id);
          setSettings(reconciled);
          return;
        }

        const notificationId = await rescheduleDailyStudyReminder({
          hour: settings.study_reminder_hour,
          minute: settings.study_reminder_minute,
          previousNotificationId: settings.study_reminder_notification_id,
        });
        const next = {
          ...settings,
          study_reminder_enabled: true,
          study_reminder_notification_id: notificationId,
        };
        await saveReminderSettings(user.id, next);
        setSettings(next);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update reminder.");
      } finally {
        setSaving(false);
      }
    },
    [permissionStatus, settings, user],
  );

  const setPreset = useCallback(
    async (preset: keyof typeof PRESETS) => {
      if (!user || !settings) return;
      const nextTime = PRESETS[preset];

      setSaving(true);
      setError(null);
      try {
        let notificationId = settings.study_reminder_notification_id;
        if (settings.study_reminder_enabled && permissionStatus === "granted") {
          notificationId = await rescheduleDailyStudyReminder({
            hour: nextTime.hour,
            minute: nextTime.minute,
            previousNotificationId: settings.study_reminder_notification_id,
          });
        }

        const next = {
          ...settings,
          study_reminder_hour: nextTime.hour,
          study_reminder_minute: nextTime.minute,
          study_reminder_notification_id: notificationId,
        };
        await saveReminderSettings(user.id, next);
        setSettings(next);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update reminder time.");
      } finally {
        setSaving(false);
      }
    },
    [permissionStatus, settings, user],
  );

  const reconcile = useCallback(async () => {
    if (!user) return;
    try {
      const next = await reconcileReminderSchedule(user.id);
      setSettings(next);
      const status = await getNotificationPermissionStatus();
      setPermissionStatus(status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reconcile reminders.");
    }
  }, [user]);

  const currentTimeLabel = useMemo(() => {
    if (!settings) return null;
    return formatReminderTime(
      settings.study_reminder_hour,
      settings.study_reminder_minute,
    );
  }, [settings]);

  return {
    settings,
    permissionStatus,
    loading,
    saving,
    error,
    currentTimeLabel,
    refresh,
    reconcile,
    requestPermission,
    toggleEnabled,
    setPreset,
  };
}

