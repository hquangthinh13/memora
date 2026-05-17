import * as Notifications from "expo-notifications";

export const STUDY_REMINDER_CHANNEL_ID = "study-reminders";
const STUDY_REMINDER_CHANNEL_NAME = "Study Reminders";
const DEFAULT_REMINDER_HOUR = 19;
const DEFAULT_REMINDER_MINUTE = 0;

const REMINDER_BODIES = [
  "Keep your streak alive with a quick Memora session.",
  "A few minutes now makes your memory stronger tomorrow.",
  "Your cards are waiting. Let us do a quick review.",
];

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

export type StudyReminderSettings = {
  study_reminder_enabled: boolean;
  study_reminder_hour: number;
  study_reminder_minute: number;
  study_reminder_notification_id: string | null;
};

function storageKey(userId: string) {
  return `study-reminder:${userId}`;
}

function defaultSettings(): StudyReminderSettings {
  return {
    study_reminder_enabled: false,
    study_reminder_hour: DEFAULT_REMINDER_HOUR,
    study_reminder_minute: DEFAULT_REMINDER_MINUTE,
    study_reminder_notification_id: null,
  };
}

function randomReminderBody() {
  return REMINDER_BODIES[Math.floor(Math.random() * REMINDER_BODIES.length)];
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "undetermined";
}

export async function ensureStudyReminderChannel() {
  await Notifications.setNotificationChannelAsync(STUDY_REMINDER_CHANNEL_ID, {
    name: STUDY_REMINDER_CHANNEL_NAME,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function scheduleDailyStudyReminder({
  hour,
  minute,
}: {
  hour: number;
  minute: number;
}) {
  await ensureStudyReminderChannel();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to review your cards",
      body: randomReminderBody(),
      sound: "default",
      data: { type: "study-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: STUDY_REMINDER_CHANNEL_ID,
    },
  });
}

export async function cancelStudyReminder(notificationId?: string | null) {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function rescheduleDailyStudyReminder({
  hour,
  minute,
  previousNotificationId,
}: {
  hour: number;
  minute: number;
  previousNotificationId?: string | null;
}) {
  await cancelStudyReminder(previousNotificationId);
  return scheduleDailyStudyReminder({ hour, minute });
}

export async function loadReminderSettings(
  userId: string,
): Promise<StudyReminderSettings> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<StudyReminderSettings>;
    return {
      study_reminder_enabled:
        parsed.study_reminder_enabled ?? defaultSettings().study_reminder_enabled,
      study_reminder_hour:
        parsed.study_reminder_hour ?? defaultSettings().study_reminder_hour,
      study_reminder_minute:
        parsed.study_reminder_minute ?? defaultSettings().study_reminder_minute,
      study_reminder_notification_id:
        parsed.study_reminder_notification_id ?? null,
    };
  } catch {
    return defaultSettings();
  }
}

export async function saveReminderSettings(
  userId: string,
  settings: StudyReminderSettings,
) {
  localStorage.setItem(storageKey(userId), JSON.stringify(settings));
}

export async function reconcileReminderSchedule(
  userId: string,
): Promise<StudyReminderSettings> {
  const settings = await loadReminderSettings(userId);
  const permission = await getNotificationPermissionStatus();

  if (!settings.study_reminder_enabled) {
    if (settings.study_reminder_notification_id) {
      await cancelStudyReminder(settings.study_reminder_notification_id);
      const next = { ...settings, study_reminder_notification_id: null };
      await saveReminderSettings(userId, next);
      return next;
    }
    return settings;
  }

  if (permission !== "granted") {
    const next = {
      ...settings,
      study_reminder_enabled: false,
      study_reminder_notification_id: null,
    };
    await saveReminderSettings(userId, next);
    return next;
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const exists = settings.study_reminder_notification_id
    ? scheduled.some((item) => item.identifier === settings.study_reminder_notification_id)
    : false;

  if (exists) return settings;

  const notificationId = await scheduleDailyStudyReminder({
    hour: settings.study_reminder_hour,
    minute: settings.study_reminder_minute,
  });

  const next = {
    ...settings,
    study_reminder_notification_id: notificationId,
  };
  await saveReminderSettings(userId, next);
  return next;
}

export function formatReminderTime(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

