import { supabase } from "@/lib/supabase";
import type { Tables } from "@/types/database";

export type UserLearningStats = Tables<"user_learning_stats">;
export type LearningActivityDay = Tables<"learning_activity_days">;

// Returns today's date as a local YYYY-MM-DD string.
// Using local date so users in any timezone see the right streak day.
function localDateString(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Streak rules:
//   last_studied_on == today  → unchanged (already counted)
//   last_studied_on == yesterday → streak + 1
//   last_studied_on == null   → 1 (first study ever)
//   last_studied_on older     → 1 (streak broken)
function computeNewStreak(
  lastStudiedOn: string | null,
  currentStreak: number,
): number {
  const today = localDateString();
  const yesterday = localDateString(-1);
  if (!lastStudiedOn) return 1;
  if (lastStudiedOn === today) return currentStreak;
  if (lastStudiedOn === yesterday) return currentStreak + 1;
  return 1;
}

export async function getLearningStats(
  userId: string,
): Promise<UserLearningStats | null> {
  const { data, error } = await supabase
    .from("user_learning_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getWeeklyActivity(
  userId: string,
): Promise<LearningActivityDay[]> {
  const fromDate = localDateString(-6);

  const { data, error } = await supabase
    .from("learning_activity_days")
    .select("*")
    .eq("user_id", userId)
    .gte("activity_date", fromDate)
    .order("activity_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function recordCardStudy({
  userId,
  cardId,
}: {
  userId: string;
  cardId: string;
}): Promise<void> {
  const today = localDateString();
  const nowIso = new Date().toISOString();
  const now = new Date();

  const { data: existingProgress, error: progressError } = await supabase
    .from("study_progress")
    .select("last_reviewed_at")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .maybeSingle();

  if (progressError) throw progressError;

  const alreadyCountedToday = (() => {
    if (!existingProgress?.last_reviewed_at) return false;
    const reviewed = new Date(existingProgress.last_reviewed_at);
    return (
      reviewed.getFullYear() === now.getFullYear() &&
      reviewed.getMonth() === now.getMonth() &&
      reviewed.getDate() === now.getDate()
    );
  })();

  const { error: progressUpsertError } = await supabase
    .from("study_progress")
    .upsert(
      {
        user_id: userId,
        card_id: cardId,
        last_reviewed_at: nowIso,
      },
      { onConflict: "user_id,card_id" },
    );

  if (progressUpsertError) throw progressUpsertError;

  if (alreadyCountedToday) return;

  const { data: existing } = await supabase
    .from("user_learning_stats")
    .select(
      "total_cards_studied, total_quizzes_completed, total_questions_answered, total_correct_answers, total_incorrect_answers, current_streak, longest_streak, last_studied_on",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const newStreak = computeNewStreak(
    existing?.last_studied_on ?? null,
    existing?.current_streak ?? 0,
  );
  const newLongest = Math.max(existing?.longest_streak ?? 0, newStreak);

  const { error: statsError } = await supabase
    .from("user_learning_stats")
    .upsert(
      {
        user_id: userId,
        total_cards_studied: (existing?.total_cards_studied ?? 0) + 1,
        total_quizzes_completed: existing?.total_quizzes_completed ?? 0,
        total_questions_answered: existing?.total_questions_answered ?? 0,
        total_correct_answers: existing?.total_correct_answers ?? 0,
        total_incorrect_answers: existing?.total_incorrect_answers ?? 0,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_studied_on: today,
      },
      { onConflict: "user_id" },
    );

  if (statsError) throw statsError;

  const { data: existingDay } = await supabase
    .from("learning_activity_days")
    .select("cards_studied, quizzes_completed, questions_answered, correct_answers, incorrect_answers")
    .eq("user_id", userId)
    .eq("activity_date", today)
    .maybeSingle();

  const { error: dayError } = await supabase
    .from("learning_activity_days")
    .upsert(
      {
        user_id: userId,
        activity_date: today,
        cards_studied: (existingDay?.cards_studied ?? 0) + 1,
        quizzes_completed: existingDay?.quizzes_completed ?? 0,
        questions_answered: existingDay?.questions_answered ?? 0,
        correct_answers: existingDay?.correct_answers ?? 0,
        incorrect_answers: existingDay?.incorrect_answers ?? 0,
      },
      { onConflict: "user_id,activity_date" },
    );

  if (dayError) throw dayError;
}

export async function recordQuizCompletion(
  userId: string,
  {
    questionsAnswered,
    correct,
    incorrect,
  }: { questionsAnswered: number; correct: number; incorrect: number },
): Promise<void> {
  const today = localDateString();

  const { data: existing } = await supabase
    .from("user_learning_stats")
    .select(
      "total_cards_studied, total_quizzes_completed, total_questions_answered, total_correct_answers, total_incorrect_answers, current_streak, longest_streak, last_studied_on",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const newStreak = computeNewStreak(
    existing?.last_studied_on ?? null,
    existing?.current_streak ?? 0,
  );
  const newLongest = Math.max(existing?.longest_streak ?? 0, newStreak);

  const { error: statsError } = await supabase
    .from("user_learning_stats")
    .upsert(
      {
        user_id: userId,
        total_cards_studied: existing?.total_cards_studied ?? 0,
        total_quizzes_completed: (existing?.total_quizzes_completed ?? 0) + 1,
        total_questions_answered:
          (existing?.total_questions_answered ?? 0) + questionsAnswered,
        total_correct_answers: (existing?.total_correct_answers ?? 0) + correct,
        total_incorrect_answers:
          (existing?.total_incorrect_answers ?? 0) + incorrect,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_studied_on: today,
      },
      { onConflict: "user_id" },
    );

  if (statsError) throw statsError;

  const { data: existingDay } = await supabase
    .from("learning_activity_days")
    .select("cards_studied, quizzes_completed, questions_answered, correct_answers, incorrect_answers")
    .eq("user_id", userId)
    .eq("activity_date", today)
    .maybeSingle();

  const { error: dayError } = await supabase
    .from("learning_activity_days")
    .upsert(
      {
        user_id: userId,
        activity_date: today,
        cards_studied: existingDay?.cards_studied ?? 0,
        quizzes_completed: (existingDay?.quizzes_completed ?? 0) + 1,
        questions_answered:
          (existingDay?.questions_answered ?? 0) + questionsAnswered,
        correct_answers: (existingDay?.correct_answers ?? 0) + correct,
        incorrect_answers: (existingDay?.incorrect_answers ?? 0) + incorrect,
      },
      { onConflict: "user_id,activity_date" },
    );

  if (dayError) throw dayError;
}
