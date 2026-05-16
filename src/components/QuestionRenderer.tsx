import { View } from "react-native";

import type { Question } from "@/services/questions";
import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type QuestionRendererProps = {
  question: Question;
  index: number;
  total: number;
  timeLeft: number;
  timeLimit: number;
  score: number;
  wrongCount: number;
};

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  fill_in_the_blank: "Fill in the blank",
  short_answer: "Short answer",
};

const TYPE_CARD_COLORS: Record<string, string> = {
  mcq: "bg-peach-soft",
  true_false: "bg-mint-soft",
  fill_in_the_blank: "bg-lavender-soft",
  short_answer: "bg-yellow-soft",
};

export function QuestionRenderer({
  question,
  index,
  total,
  timeLeft,
  timeLimit,
  score,
  wrongCount,
}: QuestionRendererProps) {
  const progress = total ? Math.round(((index + 1) / total) * 100) : 0;
  const timerPercent = timeLimit ? Math.max(0, (timeLeft / timeLimit) * 100) : 0;
  const typeLabel = TYPE_LABELS[question.type] ?? question.type.replace(/_/g, " ");
  const cardColor = TYPE_CARD_COLORS[question.type] ?? "bg-peach-soft";

  return (
    <AppCard className={`gap-5 rounded-3xl ${cardColor}`}>
      {/* Top row: progress counter + type badge */}
      <View className="flex-row items-center justify-between">
        <AppText variant="caption">
          {index + 1} of {total}
        </AppText>

        <View className="rounded-full bg-surface px-3 py-1">
          <AppText variant="caption" className="font-sans-semibold">
            {typeLabel}
          </AppText>
        </View>
      </View>

      {/* Progress bar */}
      <View className="gap-2">
        <View className="h-2 overflow-hidden rounded-full bg-surface">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </View>

        <View className="flex-row justify-between">
          <AppText variant="caption">Correct: {score}</AppText>
          <AppText variant="caption">Wrong: {wrongCount}</AppText>
        </View>
      </View>

      {/* Timer */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <AppText variant="caption">Time left</AppText>
          <AppText variant="caption" className="font-sans-semibold">
            {timeLimit ? `${timeLeft}s` : "No limit"}
          </AppText>
        </View>

        {timeLimit ? (
          <View className="h-3 overflow-hidden rounded-full bg-surface">
            <View
              className="h-full rounded-full bg-danger"
              style={{ width: `${timerPercent}%` }}
            />
          </View>
        ) : null}
      </View>

      {/* Question text */}
      <AppText variant="subtitle">{question.question}</AppText>

      <AppText variant="caption">Difficulty {question.difficulty}/5</AppText>
    </AppCard>
  );
}
