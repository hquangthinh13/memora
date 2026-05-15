import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";
import { safelyDeleteCloudinaryImage } from "./cloudinary";

export type Deck = Tables<"decks">;
export type Card = Tables<"cards">;
export type DeckCollaborator = Tables<"deck_collaborators">;
export type DeckPermission = "owner" | "editor" | "viewer";
export type DeckSummary = Deck & {
  card_count: number;
  collaborator_count: number;
  permission: DeckPermission;
};
export type DeckWithCards = Deck & {
  cards: Card[];
  deck_collaborators?: DeckCollaborator[];
  card_count: number;
  collaborator_count: number;
  permission: DeckPermission;
};
type DeckSummaryRow = Deck & {
  cards?: Pick<Card, "id">[];
  deck_collaborators?: DeckCollaborator[];
};
type DeckDetailRow = Deck & {
  cards?: Card[];
  deck_collaborators?: DeckCollaborator[];
};

function getPermission(
  deck: Pick<Deck, "owner_id"> & { deck_collaborators?: DeckCollaborator[] },
  userId?: string | null,
): DeckPermission {
  if (userId && deck.owner_id === userId) return "owner";

  const collaborator = deck.deck_collaborators?.find(
    (item) => item.user_id === userId && item.status === "accepted",
  );

  if (collaborator?.role === "owner" || collaborator?.role === "editor") {
    return collaborator.role;
  }

  return "viewer";
}

async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listDecks() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("decks")
    .select("*, cards(id), deck_collaborators(*)")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as DeckSummaryRow[];

  return rows.map((deck) => {
    const cards = Array.isArray(deck.cards) ? deck.cards : [];
    const collaborators =
      Array.isArray(deck.deck_collaborators)
        ? deck.deck_collaborators
        : [];

    return {
      ...deck,
      card_count: cards.length,
      collaborator_count: collaborators.filter((item) => item.status === "accepted").length,
      permission: getPermission(
        { owner_id: deck.owner_id, deck_collaborators: collaborators },
        userId,
      ),
    };
  }) as DeckSummary[];
}

export async function getDeckDetail(deckId: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("decks")
    .select("*, cards(*), deck_collaborators(*)")
    .eq("id", deckId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) return null;

  const row = data as unknown as DeckDetailRow;
  const collaborators =
    Array.isArray(row.deck_collaborators)
      ? row.deck_collaborators
      : [];
  const cards = Array.isArray(row.cards) ? row.cards : [];

  return {
    ...row,
    cards,
    deck_collaborators: collaborators,
    card_count: cards.length,
    collaborator_count: collaborators.filter((item) => item.status === "accepted").length,
    permission: getPermission(
      { owner_id: row.owner_id, deck_collaborators: collaborators },
      userId,
    ),
  } as DeckWithCards;
}

export async function createDeck(deck: Inserts<"decks">) {
  const { data, error } = await supabase
    .from("decks")
    .insert(deck)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateDeck(deckId: string, deck: Updates<"decks">) {
  const { data, error } = await supabase
    .from("decks")
    .update(deck)
    .eq("id", deckId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteDeck(deckId: string) {
  const { error } = await supabase.from("decks").delete().eq("id", deckId);

  if (error) {
    throw error;
  }
}

export async function deleteDeckWithCoverImage(deck: Pick<Deck, "id" | "cover_image_public_id">) {
  let coverDeleteWarning: string | null = null;

  if (deck.cover_image_public_id) {
    // The Edge Function verifies deck permissions, so cleanup must happen while the deck row still exists.
    coverDeleteWarning = await safelyDeleteCloudinaryImage({
      deckId: deck.id,
      publicId: deck.cover_image_public_id,
    });
  }

  await deleteDeck(deck.id);

  return { coverDeleteWarning };
}

export async function listSavedDecks() {
  const { data, error } = await supabase
    .from("saved_decks")
    .select("*, decks(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listCollaborativeDecks() {
  const { data, error } = await supabase
    .from("deck_collaborators")
    .select("*, decks(*)")
    .eq("status", "accepted")
    .neq("role", "owner")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
