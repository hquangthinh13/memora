import { View } from "react-native";

import type { QuizAnswerResult } from "@/hooks/useQuizSession";
import { AppCard, AppText } from "@/components/shared";
import { ResultAnswerSection } from "./ResultAnswerSection";

type QuizReviewItemProps = {
  result: QuizAnswerResult;
  typeLabel: string;
  correctAnswerText: string;
  compact?: boolean;
};

export function QuizReviewItem({
  result,
  typeLabel,
  correctAnswerText,
  compact = false,
}: QuizReviewItemProps) {
  const statusText = result.timedOut
    ? "Timed out"
    : result.correct
      ? "Correct"
      : "Incorrect";
  const statusClassName = result.correct
    ? "bg-mint-soft text-text"
    : result.timedOut
      ? "bg-yellow-soft text-text"
      : "bg-pink-soft text-danger";

  return (
    <AppCard className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className={`rounded-full px-3 py-1 ${statusClassName}`}>
          <AppText
            variant="caption"
            className={`font-sans-semibold ${result.correct ? "text-text" : result.timedOut ? "text-text" : "text-danger"}`}
          >
            {statusText}
          </AppText>
        </View>
        <AppText variant="caption" className="text-text-muted">
          {typeLabel}
        </AppText>
      </View>

      <AppText variant="caption" className="text-text-muted">
        {result.question.question}
      </AppText>

      {!compact || !result.correct ? (
        <>
          <ResultAnswerSection
            label="Your answer"
            value={result.timedOut ? "Timed out" : String(result.answer || "—")}
            className="bg-peach-soft border-peach"
          />
          <View className="h-px bg-border/70" />
          <ResultAnswerSection
            label="Correct answer"
            value={correctAnswerText}
            className="bg-mint-soft border-mint"
          />
        </>
      ) : (
        <AppText variant="caption">
          Your answer:{" "}
          {result.timedOut ? "Timed out" : String(result.answer || "—")}
        </AppText>
      )}
    </AppCard>
  );
}
