import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";
import { safelyDeleteCloudinaryImage } from "./cloudinary";
import { normalizeCard } from "./cards";

export type Deck = Tables<"decks">;
export type Card = Tables<"cards">;
export type Topic = Tables<"topics">;
export type Question = Tables<"questions">;
export type DeckCollaborator = Tables<"deck_collaborators">;
export type CollaboratorPreviewProfile = Pick<
  Tables<"users">,
  "id" | "display_name" | "avatar_url" | "email"
>;
export type DeckPermission = "owner" | "editor" | "viewer";
export type DeckSummary = Deck & {
  card_count: number;
  question_count: number;
  collaborator_count: number;
  permission: DeckPermission;
  collaborators: CollaboratorPreviewProfile[];
  topics?: Pick<Topic, "id" | "name"> | null;
};
export type PublishedDeckSummary = Deck & {
  card_count: number;
  question_count: number;
  collaborator_count: number;
  collaborators: CollaboratorPreviewProfile[];
  topics?: Pick<Topic, "id" | "name"> | null;
};
export type DeckWithCards = Deck & {
  cards: Card[];
  questions?: Pick<Question, "id">[];
  deck_collaborators?: DeckCollaborator[];
  card_count: number;
  question_count: number;
  collaborator_count: number;
  permission: DeckPermission;
  topics?: Pick<Topic, "id" | "name"> | null;
};
type DeckSummaryRow = Deck & {
  cards?: Pick<Card, "id">[];
  questions?: Pick<Question, "id">[];
  deck_collaborators?: DeckCollaborator[];
  topics?: Pick<Topic, "id" | "name"> | null;
};
type DeckListRow = Deck & {
  topics?: Pick<Topic, "id" | "name"> | null;
  cards?: Pick<Card, "id">[];
  questions?: Pick<Question, "id">[];
  deck_collaborators?: DeckCollaborator[];
};

export type FriendPublishedDeckGroup = {
  owner_id: string;
  decks: PublishedDeckSummary[];
};
type DeckDetailRow = Deck & {
  cards?: Card[];
  questions?: Pick<Question, "id">[];
  deck_collaborators?: DeckCollaborator[];
  topics?: Pick<Topic, "id" | "name"> | null;
};

function createClientId() {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") return randomUUID.call(globalThis.crypto);

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const nibble = char === "x" ? value : (value & 0x3) | 0x8;
    return nibble.toString(16);
  });
}

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

async function buildCollaboratorProfilesByDeck(
  rows: Array<Pick<Deck, "id"> & { deck_collaborators?: DeckCollaborator[] }>,
) {
  const collaboratorIds = [
    ...new Set(
      rows.flatMap((row) =>
        (row.deck_collaborators ?? [])
          .filter((item) => item.status === "accepted" && item.role !== "owner")
          .map((item) => item.user_id),
      ),
    ),
  ];

  const profileMap = new Map<string, CollaboratorPreviewProfile>();
  if (collaboratorIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from("users")
      .select("id, display_name, avatar_url, email")
      .in("id", collaboratorIds);

    if (profileError) throw profileError;

    for (const profile of profiles ?? []) {
      profileMap.set(profile.id, profile);
    }
  }

  const collaboratorsByDeck = new Map<string, CollaboratorPreviewProfile[]>();

  for (const row of rows) {
    const collaborators = (row.deck_collaborators ?? [])
      .filter((item) => item.status === "accepted" && item.role !== "owner")
      .map((item) => profileMap.get(item.user_id))
      .filter((item): item is CollaboratorPreviewProfile => Boolean(item));

    collaboratorsByDeck.set(row.id, collaborators);
  }

  return collaboratorsByDeck;
}

export async function listDecks() {
  const userId = await getCurrentUserId();
  if (!userId) return [] as DeckSummary[];

  const { data, error } = await supabase
    .from("decks")
    .select("*, topics(id, name), cards(id), questions(id), deck_collaborators(*)")
    .eq("owner_id", userId)
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as DeckSummaryRow[];
  const collaboratorsByDeck = await buildCollaboratorProfilesByDeck(rows);

  return rows.map((deck) => {
    const cards = Array.isArray(deck.cards) ? deck.cards : [];
    const questions = Array.isArray(deck.questions) ? deck.questions : [];
    const collaborators =
      Array.isArray(deck.deck_collaborators)
        ? deck.deck_collaborators
        : [];

    return {
      ...deck,
      card_count: cards.length,
      question_count: questions.length,
      collaborator_count: collaborators.filter((item) => item.status === "accepted").length,
      collaborators: collaboratorsByDeck.get(deck.id) ?? [],
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
    .select("*, topics(id, name), cards(*), questions(id), deck_collaborators(*)")
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
  const cards = Array.isArray(row.cards) ? row.cards.map(normalizeCard) : [];
  const questions = Array.isArray(row.questions) ? row.questions : [];

  return {
    ...row,
    cards,
    questions,
    deck_collaborators: collaborators,
    card_count: cards.length,
    question_count: questions.length,
    collaborator_count: collaborators.filter((item) => item.status === "accepted").length,
    permission: getPermission(
      { owner_id: row.owner_id, deck_collaborators: collaborators },
      userId,
    ),
  } as DeckWithCards;
}

export async function createDeck(deck: Inserts<"decks">) {
  const now = new Date().toISOString();
  const id = deck.id ?? createClientId();
  const payload = { ...deck, id };

  const { error } = await supabase
    .from("decks")
    .insert(payload);

  if (error) {
    throw error;
  }

  return {
    owner_id: payload.owner_id,
    title: payload.title,
    id,
    description: payload.description ?? null,
    visibility: payload.visibility ?? "PRIVATE",
    share_code: payload.share_code ?? null,
    language: payload.language ?? null,
    tags: payload.tags ?? [],
    cover_url: payload.cover_url ?? null,
    cover_image_url: payload.cover_image_url ?? null,
    cover_image_public_id: payload.cover_image_public_id ?? null,
    topic_id: payload.topic_id ?? null,
    source_type: payload.source_type ?? "text",
    source_text: payload.source_text ?? null,
    source_file_path: payload.source_file_path ?? null,
    status: payload.status ?? "Ready",
    generation_error: payload.generation_error ?? null,
    is_archived: payload.is_archived ?? false,
    created_at: payload.created_at ?? now,
    updated_at: payload.updated_at ?? now,
  } satisfies Deck;
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

  const rows = (data ?? []) as Array<DeckCollaborator & {
    decks: Deck | null;
  }>;
  const deckRows = rows
    .filter((row): row is DeckCollaborator & { decks: Deck } => Boolean(row.decks))
    .map((row) => row.decks);

  if (!deckRows.length) return [];

  const deckIds = [...new Set(deckRows.map((deck) => deck.id))];
  const { data: enrichedDecks, error: enrichedDecksError } = await supabase
    .from("decks")
    .select("*, topics(id, name), cards(id), questions(id), deck_collaborators(*)")
    .in("id", deckIds);

  if (enrichedDecksError) throw enrichedDecksError;

  const typedEnrichedDecks = (enrichedDecks ?? []) as unknown as DeckListRow[];
  const collaboratorsByDeck = await buildCollaboratorProfilesByDeck(typedEnrichedDecks);

  const mappedDecks = new Map<string, DeckSummary>();

  for (const deck of typedEnrichedDecks) {
    const cards = Array.isArray(deck.cards) ? deck.cards : [];
    const questions = Array.isArray(deck.questions) ? deck.questions : [];
    const collaborators = Array.isArray(deck.deck_collaborators)
      ? deck.deck_collaborators
      : [];

    mappedDecks.set(deck.id, {
      ...deck,
      card_count: cards.length,
      question_count: questions.length,
      collaborator_count: collaborators.filter((item) => item.status === "accepted").length,
      collaborators: collaboratorsByDeck.get(deck.id) ?? [],
      permission: "viewer",
    });
  }

  return rows
    .map((entry) => ({
      ...entry,
      decks: entry.decks ? mappedDecks.get(entry.decks.id) ?? null : null,
    }))
    .filter((entry) => entry.decks !== null);
}

export async function listMyPublishedDecks({
  limit,
  offset = 0,
}: {
  limit: number;
  offset?: number;
}) {
  const start = offset;
  const end = offset + limit - 1;
  const { data, error, count } = await supabase
    .from("decks")
    .select("*, topics(id, name), cards(id), questions(id), deck_collaborators(*)", { count: "exact" })
    .eq("visibility", "PUBLIC")
    .eq("status", "Ready")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false })
    .range(start, end);

  if (error) throw error;

  const rows = (data ?? []) as unknown as DeckListRow[];
  const collaboratorsByDeck = await buildCollaboratorProfilesByDeck(rows);

  const items = rows.map((row) => ({
    ...row,
    card_count: Array.isArray(row.cards) ? row.cards.length : 0,
    question_count: Array.isArray(row.questions) ? row.questions.length : 0,
    collaborator_count: Array.isArray(row.deck_collaborators)
      ? row.deck_collaborators.filter((item) => item.status === "accepted").length
      : 0,
    collaborators: collaboratorsByDeck.get(row.id) ?? [],
  })) as PublishedDeckSummary[];

  return {
    items,
    hasMore: items.length === limit,
    totalCount: count ?? 0,
  };
}

export async function listPublishedDecksForOwners(ownerIds: string[]) {
  if (!ownerIds.length) return [] as PublishedDeckSummary[];

  const { data, error } = await supabase
    .from("decks")
    .select("*, topics(id, name), cards(id), questions(id), deck_collaborators(*)")
    .in("owner_id", ownerIds)
    .eq("visibility", "PUBLIC")
    .eq("status", "Ready")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DeckListRow[];
  const collaboratorsByDeck = await buildCollaboratorProfilesByDeck(rows);

  return rows.map((row) => ({
    ...row,
    card_count: Array.isArray(row.cards) ? row.cards.length : 0,
    question_count: Array.isArray(row.questions) ? row.questions.length : 0,
    collaborator_count: Array.isArray(row.deck_collaborators)
      ? row.deck_collaborators.filter((item) => item.status === "accepted").length
      : 0,
    collaborators: collaboratorsByDeck.get(row.id) ?? [],
  })) as PublishedDeckSummary[];
}
