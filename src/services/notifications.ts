import { supabase } from "@/lib/supabase";
import type { Json, Tables } from "@/types/database";

export type NotificationType =
  | "friend_request"
  | "friend_request_accepted"
  | "deck_processing_completed"
  | "deck_invitation"
  | "deck_invitation_accepted";

export type Notification = Tables<"notifications">;

export type NotificationMetadata = {
  deck_id?: string;
  friendship_id?: string;
  collaborator_id?: string;
  requester_id?: string;
  addressee_id?: string;
  invited_by?: string;
  user_id?: string;
  role?: string;
  status?: string;
  generation_error?: string | null;
};

export function parseNotificationMetadata(metadata: Json | null): NotificationMetadata {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object") {
    return {};
  }

  return metadata as NotificationMetadata;
}

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listMyNotifications(): Promise<Notification[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead() {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
}
