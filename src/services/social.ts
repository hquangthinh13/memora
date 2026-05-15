import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Friendship = Tables<"friendships">;
export type UserProfile = Tables<"users">;
export type DeckCollaborator = Tables<"deck_collaborators">;

export async function listFriendships() {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createFriendRequest(friendship: Inserts<"friendships">) {
  const { data, error } = await supabase
    .from("friendships")
    .insert(friendship)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateFriendRequest(
  friendshipId: string,
  friendship: Updates<"friendships">,
) {
  const { data, error } = await supabase
    .from("friendships")
    .update(friendship)
    .eq("id", friendshipId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listDeckCollaborators(deckId: string) {
  const { data, error } = await supabase
    .from("deck_collaborators")
    .select("*, users(*)")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
