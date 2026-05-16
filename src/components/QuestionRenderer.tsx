import { View } from "react-native";

import { AppCard } from "./AppCard";
import { AppText } from "./AppText";
import type { Question } from "@/services/questions";

type QuestionRendererProps = {
  question: Question;
  index: number;
  total: number;
  timeLeft: number;
  timeLimit: number;
  score: number;
  wrongCount: number;
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
  const timerPercent = timeLimit
    ? Math.max(0, (timeLeft / timeLimit) * 100)
    : 0;

  return (
    <AppCard className="gap-5 rounded-3xl bg-peach-soft">
      <View className="flex-row items-center justify-between">
        <AppText variant="caption">
          Question {index + 1} of {total}
        </AppText>

        <View className="rounded-full bg-surface px-3 py-1">
          <AppText variant="caption" className="font-sans-semibold">
            {question.type.replace(/_/g, " ")}
          </AppText>
        </View>
      </View>

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

      <AppText variant="subtitle">{question.question}</AppText>

      <AppText variant="caption">Difficulty {question.difficulty}/5</AppText>
    </AppCard>
  );
}
