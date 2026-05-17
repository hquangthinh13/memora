import {
  Calendar03Icon,
  Quiz02Icon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Image } from "expo-image";
import { View } from "react-native";

import Images from "@/constants/images";
import type { WeekDay } from "@/hooks/useLearningProgress";
import type { UserLearningStats } from "@/services/learningProgress";
import { AppCard } from "@/components/shared";
import { AppText } from "@/components/shared";

type Props = {
  stats: UserLearningStats | null;
  weeklyActivity: WeekDay[];
  todayCards: number;
  accuracy: number | null;
  loading?: boolean;
};

type StreakTier = "none" | "low" | "mid" | "high";

type StatBoxProps = {
  label: string;
  value: string;
  tone: "mint" | "peach" | "lavender";
  icon: "calendar" | "quiz";
  streakTier?: StreakTier;
};

function streakTierFor(streak: number): StreakTier {
  if (streak <= 0) return "none";
  if (streak <= 2) return "low";
  if (streak <= 6) return "mid";
  return "high";
}

function streakValueClass(tier: StreakTier) {
  if (tier === "none") return "text-text";
  if (tier === "low") return "text-text";
  if (tier === "mid") return "text-text";
  return "text-text";
}

function iconFor(type: StatBoxProps["icon"]) {
  if (type === "calendar") return Calendar03Icon;
  return Quiz02Icon;
}

function toneClass(tone: StatBoxProps["tone"]) {
  if (tone === "mint") return "bg-pink-soft border-pink";
  if (tone === "peach") return "bg-peach-soft border-peach";
  return "bg-lavender-soft border-lavender";
}

function StatBox({ label, value, tone, icon, streakTier }: StatBoxProps) {
  return (
    <View
      className={`relative flex-1 overflow-hidden rounded-lg border p-3 ${toneClass(tone)}`}
    >
      {/* <Image
        source={Images.floral03}
        style={{
          position: "absolute",
          right: -8,
          bottom: -6,
          width: 52,
          height: 52,
          opacity: 1,
          transform: [{ rotate: "18deg" }],
        }}
        contentFit="contain"
      /> */}
      <View className="flex-row items-start justify-between gap-2">
        <AppText
          variant="caption"
          className="flex-1 text-text-muted leading-4"
          numberOfLines={2}
        >
          {label}
        </AppText>
        <HugeiconsIcon icon={iconFor(icon)} size={14} color="#706A68" />
      </View>
      <AppText
        variant="title"
        className={`mt-1 text-2xl leading-8 ${streakTier ? streakValueClass(streakTier) : "text-text"}`}
      >
        {value}
      </AppText>
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
      <View
        className="flex-row items-end gap-1"
        style={{ height: BAR_MAX_HEIGHT + 20 }}
      >
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
                className={`w-full rounded-t-md ${isToday ? "bg-peach" : "bg-peach-soft"}`}
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

function AccuracyBar({
  accuracy,
  totalIncorrect,
  totalCorrect,
}: {
  accuracy: number | null;
  totalIncorrect: number;
  totalCorrect: number;
}) {
  if (accuracy === null) return null;
  const fill = Math.max(0, Math.min(100, accuracy));

  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <AppText variant="caption" className="font-sans-semibold text-text">
          Quiz accuracy
        </AppText>

        <View className="flex-row items-center gap-1">
          <AppText variant="caption" className="font-sans-semibold text-text">
            {accuracy}%
          </AppText>
          <AppText variant="caption" className="font-sans text-text-muted">
            ({totalCorrect}/{totalIncorrect + totalCorrect})
          </AppText>
        </View>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-mint-soft">
        <View
          className="h-full rounded-full bg-mint"
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
    (stats?.total_cards_studied ?? 0) > 0 || totalQuizzes > 0;
  const streakTier = streakTierFor(streak);

  if (loading) {
    return (
      <AppCard className="gap-4">
        <AppText variant="subtitle">Learning progress</AppText>
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-lg bg-surface-soft p-4"
            style={{ height: 72 }}
          />
          <View
            className="flex-1 rounded-lg bg-surface-soft p-4"
            style={{ height: 72 }}
          />
          <View
            className="flex-1 rounded-lg bg-surface-soft p-4"
            style={{ height: 72 }}
          />
        </View>
      </AppCard>
    );
  }

  if (!hasAnyActivity) {
    return (
      <AppCard className="gap-4">
        <AppText variant="subtitle">Learning progress</AppText>
        <View className="flex-row gap-3">
          <StatBox
            label="Streak"
            value="0"
            tone="peach"
            icon="calendar"
            streakTier="none"
          />
          <StatBox
            label="Cards today"
            value="0"
            tone="lavender"
            icon="calendar"
          />
          <StatBox label="Quizzes done" value="0" tone="mint" icon="quiz" />
        </View>
        <AppText variant="caption">
          Start studying or take a quiz to track your progress.
        </AppText>
      </AppCard>
    );
  }

  return (
    <AppCard className="relative gap-5 overflow-hidden">
      <Image
        source={Images.floral03}
        style={{
          position: "absolute",
          right: -8,
          top: -8,
          width: 112,
          height: 112,
          opacity: 0.4,
          transform: [{ rotate: "18deg" }],
        }}
        contentFit="contain"
      />
      <AppText variant="subtitle">Learning progress</AppText>

      <View className="flex-row gap-3">
        <StatBox
          label="Day streak"
          value={String(streak)}
          tone="peach"
          icon="calendar"
          streakTier={streakTier}
        />
        <StatBox
          label="Cards today"
          value={String(todayCards)}
          tone="lavender"
          icon="calendar"
        />
        <StatBox
          label="Quizzes done"
          value={String(totalQuizzes)}
          tone="mint"
          icon="quiz"
        />
      </View>

      {accuracy !== null && (
        <AccuracyBar
          totalCorrect={totalCorrect}
          totalIncorrect={totalIncorrect}
          accuracy={accuracy}
        />
      )}

      {weeklyActivity.length > 0 && <WeeklyBarChart days={weeklyActivity} />}
    </AppCard>
  );
}
