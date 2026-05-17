import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import {
  getLearningStats,
  getWeeklyActivity,
  type LearningActivityDay,
  type UserLearningStats,
} from "@/services/learningProgress";

// Fills in zero-activity entries for every day in the last 7 days so charts
// always have 7 data points regardless of gaps in the database.
function buildWeekGrid(
  rows: LearningActivityDay[],
): { date: string; dayLabel: string; cards_studied: number; quizzes_completed: number; correct_answers: number; incorrect_answers: number }[] {
  const byDate = new Map(rows.map((r) => [r.activity_date, r]));
  const result = [];
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;
    const row = byDate.get(date);
    result.push({
      date,
      dayLabel: dayLabels[d.getDay()],
      cards_studied: row?.cards_studied ?? 0,
      quizzes_completed: row?.quizzes_completed ?? 0,
      correct_answers: row?.correct_answers ?? 0,
      incorrect_answers: row?.incorrect_answers ?? 0,
    });
  }
  return result;
}

export type WeekDay = ReturnType<typeof buildWeekGrid>[number];

export function useLearningProgress() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserLearningStats | null>(null);
  const [weeklyActivity, setWeeklyActivity] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const [fetchedStats, fetchedActivity] = await Promise.all([
        getLearningStats(user.id),
        getWeeklyActivity(user.id),
      ]);
      setStats(fetchedStats);
      setWeeklyActivity(buildWeekGrid(fetchedActivity));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load progress.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const todayDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const todayActivity = weeklyActivity.find((w) => w.date === todayDate);

  const totalCorrect = stats?.total_correct_answers ?? 0;
  const totalAnswered = stats?.total_questions_answered ?? 0;
  const accuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  // Legacy field kept for any remaining consumers
  const studiedCount = stats?.total_cards_studied ?? 0;

  return {
    stats,
    weeklyActivity,
    todayCards: todayActivity?.cards_studied ?? 0,
    accuracy,
    studiedCount,
    loading,
    error,
    refresh,
  };
}
