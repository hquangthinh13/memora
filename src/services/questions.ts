import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Question = Tables<"questions">;
export type QuestionType = Question["type"];

export async function listQuestions(deckId: string) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("deck_id", deckId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function createQuestion(question: Inserts<"questions">) {
  const { data, error } = await supabase
    .from("questions")
    .insert(question)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateQuestion(questionId: string, question: Updates<"questions">) {
  const { data, error } = await supabase
    .from("questions")
    .update(question)
    .eq("id", questionId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteQuestion(questionId: string) {
  const { error } = await supabase.from("questions").delete().eq("id", questionId);

  if (error) throw error;
}
