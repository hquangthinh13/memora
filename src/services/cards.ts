import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Card = Tables<"cards">;

export async function listCards(deckId: string) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
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
