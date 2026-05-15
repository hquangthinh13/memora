import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";
import { listCards } from "./cards";

export type StudyProgress = Tables<"study_progress">;

export async function getStudyCards(deckId: string) {
  return listCards(deckId);
}

export async function getStudiedCardCount(userId: string) {
  const { count, error } = await supabase
    .from("study_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function recordStudyAnswer({
  userId,
  cardId,
  correct,
}: {
  userId: string;
  cardId: string;
  correct: boolean;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("study_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const payload = {
    user_id: userId,
    card_id: cardId,
    correct_count: (existing?.correct_count ?? 0) + (correct ? 1 : 0),
    wrong_count: (existing?.wrong_count ?? 0) + (correct ? 0 : 1),
    repetition: (existing?.repetition ?? 0) + (correct ? 1 : 0),
    lapses: (existing?.lapses ?? 0) + (correct ? 0 : 1),
    last_reviewed_at: new Date().toISOString(),
    next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data, error } = await supabase
    .from("study_progress")
    .upsert(payload, { onConflict: "user_id,card_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
