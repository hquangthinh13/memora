import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Deck = Tables<"decks">;
export type DeckWithCards = Deck & {
  cards: Tables<"cards">[];
};

export async function listDecks() {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("is_archived", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getDeckDetail(deckId: string) {
  const { data, error } = await supabase
    .from("decks")
    .select("*, cards(*)")
    .eq("id", deckId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DeckWithCards | null;
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
