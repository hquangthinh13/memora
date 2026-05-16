import { View } from "react-native";

import type { WeekDay } from "@/hooks/useLearningProgress";
import type { UserLearningStats } from "@/services/learningProgress";
import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type Props = {
  stats: UserLearningStats | null;
  weeklyActivity: WeekDay[];
  todayCards: number;
  accuracy: number | null;
  loading?: boolean;
};

function StatBox({
  label,
  value,
  bg,
}: {
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <View className={`flex-1 rounded-2xl p-4 ${bg}`}>
      <AppText variant="title" className="text-2xl">
        {value}
      </AppText>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function WeeklyBarChart({ days }: { days: WeekDay[] }) {
  const maxCards = Math.max(...days.map((d) => d.cards_studied), 1);
  const BAR_MAX_HEIGHT = 48;

  return (
    <View className="gap-2">
      <AppText variant="caption" className="font-sans-semibold text-text">
        This week
      </AppText>
      <View className="flex-row items-end gap-1" style={{ height: BAR_MAX_HEIGHT + 20 }}>
        {days.map((day) => {
          const barHeight = Math.max(
            Math.round((day.cards_studied / maxCards) * BAR_MAX_HEIGHT),
            day.cards_studied > 0 ? 4 : 2,
          );
          const isToday = (() => {
            const d = new Date();
            const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return day.date === date;
          })();

          return (
            <View key={day.date} className="flex-1 items-center gap-1">
              <View
                className={`w-full rounded-t-md ${isToday ? "bg-mint" : "bg-mint-soft"}`}
                style={{ height: barHeight }}
              />
              <AppText
                variant="caption"
                className={`text-xs ${isToday ? "font-sans-semibold text-text" : ""}`}
              >
                {day.dayLabel}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function AccuracyBar({ accuracy }: { accuracy: number | null }) {
  if (accuracy === null) return null;
  const fill = Math.max(0, Math.min(100, accuracy));

  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <AppText variant="caption" className="font-sans-semibold text-text">
          Quiz accuracy
        </AppText>
        <AppText variant="caption" className="font-sans-semibold text-text">
          {accuracy}%
        </AppText>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-lavender-soft">
        <View
          className="h-full rounded-full bg-lavender"
          style={{ width: `${fill}%` }}
        />
      </View>
    </View>
  );
}

export function LearningDashboard({
  stats,
  weeklyActivity,
  todayCards,
  accuracy,
  loading = false,
}: Props) {
  const streak = stats?.current_streak ?? 0;
  const totalQuizzes = stats?.total_quizzes_completed ?? 0;
  const totalCorrect = stats?.total_correct_answers ?? 0;
  const totalIncorrect = stats?.total_incorrect_answers ?? 0;
  const hasAnyActivity =
    (stats?.total_cards_studied ?? 0) > 0 ||
    totalQuizzes > 0;

  if (loading) {
    return (
      <AppCard className="gap-4">
        <AppText variant="subtitle">Learning progress</AppText>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-surface-soft p-4" style={{ height: 72 }} />
          <View className="flex-1 rounded-2xl bg-surface-soft p-4" style={{ height: 72 }} />
          <View className="flex-1 rounded-2xl bg-surface-soft p-4" style={{ height: 72 }} />
        </View>
      </AppCard>
    );
  }

  if (!hasAnyActivity) {
    return (
      <AppCard className="gap-4">
        <AppText variant="subtitle">Learning progress</AppText>
        <View className="flex-row gap-3">
          <StatBox label="Streak" value="0" bg="bg-peach-soft" />
          <StatBox label="Today" value="0" bg="bg-mint-soft" />
          <StatBox label="Accuracy" value="—" bg="bg-lavender-soft" />
        </View>
        <AppText variant="caption">
          Start studying or take a quiz to track your progress.
        </AppText>
      </AppCard>
    );
  }

  return (
    <AppCard className="gap-5">
      <AppText variant="subtitle">Learning progress</AppText>

      {/* Top stats row */}
      <View className="flex-row gap-3">
        <StatBox
          label={streak === 1 ? "day streak" : "day streak"}
          value={streak === 0 ? "—" : `🔥 ${streak}`}
          bg="bg-peach-soft"
        />
        <StatBox
          label="cards today"
          value={String(todayCards)}
          bg="bg-mint-soft"
        />
        <StatBox
          label="quizzes done"
          value={String(totalQuizzes)}
          bg="bg-lavender-soft"
        />
      </View>

      {/* Accuracy bar */}
      {accuracy !== null && <AccuracyBar accuracy={accuracy} />}

      {/* Weekly activity chart */}
      {weeklyActivity.length > 0 && (
        <WeeklyBarChart days={weeklyActivity} />
      )}

      {/* Correct vs incorrect tally */}
      {(totalCorrect > 0 || totalIncorrect > 0) && (
        <View className="flex-row gap-3">
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-mint-soft px-4 py-3">
            <AppText variant="body" className="text-lg">✓</AppText>
            <View>
              <AppText variant="subtitle" className="text-base">
                {totalCorrect}
              </AppText>
              <AppText variant="caption">correct</AppText>
            </View>
          </View>
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-pink-soft px-4 py-3">
            <AppText variant="body" className="text-lg">✗</AppText>
            <View>
              <AppText variant="subtitle" className="text-base">
                {totalIncorrect}
              </AppText>
              <AppText variant="caption">incorrect</AppText>
            </View>
          </View>
        </View>
      )}
    </AppCard>
  );
}
