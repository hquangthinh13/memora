import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/services/notifications";

type NotificationsContextValue = {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const next = await listMyNotifications();
      setNotifications(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const eventType = payload.eventType;

          if (eventType === "INSERT") {
            const row = payload.new as Notification;
            setNotifications((prev) => [row, ...prev.filter((item) => item.id !== row.id)]);
            return;
          }

          if (eventType === "UPDATE") {
            const row = payload.new as Notification;
            setNotifications((prev) => prev.map((item) => (item.id === row.id ? row : item)));
            return;
          }

          if (eventType === "DELETE") {
            const row = payload.old as Notification;
            setNotifications((prev) => prev.filter((item) => item.id !== row.id));
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Could not subscribe to notifications.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      loading,
      error,
      unreadCount,
      refresh,
      markRead: async (notificationId: string) => {
        const timestamp = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notificationId && !item.read_at
              ? { ...item, read_at: timestamp }
              : item,
          ),
        );

        await markNotificationRead(notificationId);
      },
      markAllRead: async () => {
        const timestamp = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((item) => (item.read_at ? item : { ...item, read_at: timestamp })),
        );

        await markAllNotificationsRead();
      },
    }),
    [error, loading, notifications, refresh, unreadCount],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
