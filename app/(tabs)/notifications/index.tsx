import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

import {
  AppButton,
  AppText,
  EmptyState,
  NotificationItem,
  Screen,
  SectionHeader,
} from "@/components";
import { useNotifications } from "@/hooks/useNotifications";
import {
  parseNotificationMetadata,
  type Notification,
} from "@/services/notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  const unread = useMemo(
    () => notifications.notifications.filter((item) => !item.read_at),
    [notifications.notifications],
  );
  const read = useMemo(
    () => notifications.notifications.filter((item) => item.read_at),
    [notifications.notifications],
  );

  async function handleMarkAllRead() {
    if (markingAll || notifications.unreadCount === 0) return;

    setMarkingAll(true);
    try {
      await notifications.markAllRead();
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleNotificationPress(item: Notification) {
    if (!item.read_at) {
      await notifications.markRead(item.id);
    }

    const metadata = parseNotificationMetadata(item.metadata);

    if (item.type === "friend_request" || item.type === "friend_request_accepted") {
      router.push("/friends");
      return;
    }

    if (metadata.deck_id) {
      router.push(`/decks/${metadata.deck_id}`);
      return;
    }

    if (item.type === "deck_invitation") {
      router.push("/notifications");
    }
  }

  return (
    <Screen
      header={
        <SectionHeader
          title="Notifications"
          description="All your app events live here."
        >
          <AppButton
            title={markingAll ? "..." : "Read all"}
            variant="ghost"
            icon={CheckmarkCircle01Icon}
            layout="icon-leading"
            className="h-9 min-h-9 rounded-full px-3"
            disabled={markingAll || notifications.unreadCount === 0}
            onPress={handleMarkAllRead}
          />
        </SectionHeader>
      }
      scroll
      contentClassName="pb-32"
    >
      {notifications.loading ? (
        <AppText variant="caption" className="text-center text-text-muted">
          Loading...
        </AppText>
      ) : notifications.notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="When activity happens, updates will appear here."
          showIllustration
        />
      ) : (
        <>
          {unread.length > 0 ? (
            <>
              <AppText variant="subtitle">Unread ({unread.length})</AppText>
              {unread.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onPress={() => {
                    void handleNotificationPress(item);
                  }}
                  onMarkRead={(id) => {
                    void notifications.markRead(id);
                  }}
                />
              ))}
            </>
          ) : null}

          {read.length > 0 ? (
            <>
              <AppText variant="subtitle">Read ({read.length})</AppText>
              {read.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onPress={() => {
                    void handleNotificationPress(item);
                  }}
                  onMarkRead={(id) => {
                    void notifications.markRead(id);
                  }}
                />
              ))}
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}
