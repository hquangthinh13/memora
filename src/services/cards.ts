import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Card = Tables<"cards">;
export type CanonicalCardInput = {
  deck_id: string;
  front: string;
  back: string;
  explanation?: string | null;
  difficulty?: number;
  tags?: string[];
};

export function normalizeCard(card: Card): Card {
  return {
    ...card,
    front: card.front ?? card.term,
    back: card.back ?? card.definition,
  };
}

export async function listCards(deckId: string) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(normalizeCard);
}

export async function createCard(card: Inserts<"cards">) {
  const { data, error } = await supabase
    .from("cards")
    .insert(card)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCanonicalCard(card: CanonicalCardInput) {
  return createCard({
    deck_id: card.deck_id,
    front: card.front,
    back: card.back,
    term: card.front,
    definition: card.back,
    explanation: card.explanation ?? null,
    difficulty: card.difficulty ?? 3,
    tags: card.tags ?? [],
  });
}

export async function updateCard(cardId: string, card: Updates<"cards">) {
  const { data, error } = await supabase
    .from("cards")
    .update(card)
    .eq("id", cardId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCard(cardId: string) {
  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) {
    throw error;
  }
}
