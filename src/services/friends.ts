import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type UserProfile = Pick<
  Tables<"users">,
  "id" | "display_name" | "avatar_url" | "email"
>;

export type Friendship = Tables<"friendships">;
export type FriendProgress = Pick<
  Tables<"user_learning_stats">,
  "current_streak" | "total_cards_studied" | "total_quizzes_completed"
>;

export type FriendWithProfile = Friendship & { friend: UserProfile };
export type FriendWithProgress = FriendWithProfile & {
  progress: FriendProgress | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── User search ─────────────────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<UserProfile[]> {
  if (!query.trim()) return [];
  const userId = await getCurrentUserId();

  let request = supabase
    .from("users")
    .select("id, display_name, avatar_url, email")
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (userId) {
    request = request.neq("id", userId);
  }

  const { data, error } = await request;

  if (error) throw error;
  return data ?? [];
}

// ─── Friend requests ─────────────────────────────────────────────────────────

export async function sendFriendRequest(addresseeId: string) {
  const requesterId = await getCurrentUserId();

  if (!requesterId) {
    throw new Error("You need to be logged in to send friend requests.");
  }

  if (requesterId === addresseeId) {
    throw new Error("You cannot send a friend request to yourself.");
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({ requester_id: requesterId, addressee_id: addresseeId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A friend request already exists between these users.");
    }

    if (error.code === "42501") {
      throw new Error("You are not allowed to send this friend request.");
    }

    throw error;
  }
  return data;
}

export async function acceptFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function rejectFriendRequest(friendshipId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "rejected" })
    .eq("id", friendshipId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Cancel an outgoing pending request (requester removes it)
export async function cancelFriendRequest(friendshipId: string) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw error;
}

// Remove an accepted friendship (either party)
export async function removeFriend(friendshipId: string) {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) throw error;
}

// ─── Friendship queries ───────────────────────────────────────────────────────

export async function listFriends(): Promise<FriendWithProfile[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: rows, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
  if (!rows?.length) return [];

  const otherIds = rows.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id,
  );

  const { data: profiles, error: profileError } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, email")
    .in("id", otherIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((f) => ({
    ...f,
    friend: profileMap.get(
      f.requester_id === userId ? f.addressee_id : f.requester_id,
    )!,
  }));
}

export async function listFriendsWithProgress(): Promise<FriendWithProgress[]> {
  const friends = await listFriends();
  if (!friends.length) return [];

  const friendIds = friends.map((item) => item.friend.id);
  const { data, error } = await supabase
    .from("user_learning_stats")
    .select("user_id, current_streak, total_cards_studied, total_quizzes_completed")
    .in("user_id", friendIds);

  if (error) throw error;

  const progressMap = new Map(
    (data ?? []).map((row) => [row.user_id, row]),
  );

  return friends.map((item) => ({
    ...item,
    progress: progressMap.get(item.friend.id) ?? null,
  }));
}

export async function listIncomingRequests(): Promise<FriendWithProfile[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: rows, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const requesterIds = rows.map((f) => f.requester_id);

  const { data: profiles, error: profileError } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, email")
    .in("id", requesterIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((f) => ({
    ...f,
    friend: profileMap.get(f.requester_id)!,
  }));
}

export async function listOutgoingRequests(): Promise<FriendWithProfile[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: rows, error } = await supabase
    .from("friendships")
    .select("*")
    .eq("requester_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const addresseeIds = rows.map((f) => f.addressee_id);

  const { data: profiles, error: profileError } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, email")
    .in("id", addresseeIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((f) => ({
    ...f,
    friend: profileMap.get(f.addressee_id)!,
  }));
}
