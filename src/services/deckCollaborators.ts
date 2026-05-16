import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type CollaboratorRole = "viewer" | "editor";

export type CollaboratorWithProfile = Tables<"deck_collaborators"> & {
  profile: Pick<Tables<"users">, "id" | "display_name" | "avatar_url" | "email">;
};

export type DeckInvite = Tables<"deck_collaborators"> & {
  deck: Pick<Tables<"decks">, "id" | "title" | "cover_image_url" | "cover_url">;
  inviter: Pick<Tables<"users">, "id" | "display_name" | "avatar_url"> | null;
};

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ─── Invite management ────────────────────────────────────────────────────────

export async function inviteFriendToDeck(
  deckId: string,
  userId: string,
  role: CollaboratorRole,
) {
  const invitedBy = await getCurrentUserId();

  const { data, error } = await supabase
    .from("deck_collaborators")
    .insert({
      deck_id: deckId,
      user_id: userId,
      role,
      invited_by: invitedBy,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function acceptDeckInvite(inviteId: string) {
  const { error } = await supabase
    .from("deck_collaborators")
    .update({ status: "accepted" })
    .eq("id", inviteId);

  if (error) throw error;
}

export async function rejectDeckInvite(inviteId: string) {
  const { error } = await supabase
    .from("deck_collaborators")
    .update({ status: "rejected" })
    .eq("id", inviteId);

  if (error) throw error;
}

// ─── Collaborator management (owner) ─────────────────────────────────────────

export async function removeCollaborator(collaboratorId: string) {
  const { error } = await supabase
    .from("deck_collaborators")
    .delete()
    .eq("id", collaboratorId);

  if (error) throw error;
}

export async function updateCollaboratorRole(
  collaboratorId: string,
  role: CollaboratorRole,
) {
  const { error } = await supabase
    .from("deck_collaborators")
    .update({ role })
    .eq("id", collaboratorId);

  if (error) throw error;
}

// Leave a shared deck (collaborator removes themselves)
export async function leaveDeck(collaboratorId: string) {
  const { error } = await supabase
    .from("deck_collaborators")
    .delete()
    .eq("id", collaboratorId);

  if (error) throw error;
}

// ─── Listing ──────────────────────────────────────────────────────────────────

export async function listDeckCollaboratorsWithProfiles(
  deckId: string,
): Promise<CollaboratorWithProfile[]> {
  const { data: rows, error } = await supabase
    .from("deck_collaborators")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!rows?.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const { data: profiles, error: profileError } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, email")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((r) => ({
    ...r,
    profile: profileMap.get(r.user_id)!,
  }));
}

// All pending deck invites for the current user (across all decks)
export async function listMyDeckInvites(): Promise<DeckInvite[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: rows, error } = await supabase
    .from("deck_collaborators")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const deckIds = [...new Set(rows.map((r) => r.deck_id))];
  const inviterIds = [...new Set(rows.map((r) => r.invited_by).filter(Boolean) as string[])];

  const [{ data: decks }, { data: inviters }] = await Promise.all([
    supabase
      .from("decks")
      .select("id, title, cover_image_url, cover_url")
      .in("id", deckIds),
    inviterIds.length
      ? supabase
          .from("users")
          .select("id, display_name, avatar_url")
          .in("id", inviterIds)
      : Promise.resolve({ data: [] as Pick<Tables<"users">, "id" | "display_name" | "avatar_url">[] }),
  ]);

  const deckMap = new Map((decks ?? []).map((d) => [d.id, d]));
  const inviterMap = new Map((inviters ?? []).map((u) => [u.id, u]));

  return rows
    .filter((r) => deckMap.has(r.deck_id))
    .map((r) => ({
      ...r,
      deck: deckMap.get(r.deck_id)!,
      inviter: r.invited_by ? (inviterMap.get(r.invited_by) ?? null) : null,
    }));
}
