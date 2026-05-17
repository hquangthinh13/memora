import { useMemo, useState } from "react";
import { View } from "react-native";

import type { QuizAnswerResult } from "@/hooks/useQuizSession";
import { AppButton, AppCard, AppText } from "@/components/shared";
import { QuizResultSummaryCard } from "./QuizResultSummaryCard";
import { QuizReviewItem } from "./QuizReviewItem";
import { QuizTypeBreakdown } from "./QuizTypeBreakdown";

type QuizResultProps = {
  score: number;
  total: number;
  results: QuizAnswerResult[];
  onRestart: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  fill_in_the_blank: "Fill in the blank",
  short_answer: "Short answer",
};

const TYPE_COLORS: Record<string, string> = {
  mcq: "bg-peach-soft",
  true_false: "bg-mint-soft",
  fill_in_the_blank: "bg-lavender-soft",
  short_answer: "bg-yellow-soft",
};

function formatCorrectAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.join(" / ");
  if (typeof value === "string") return value;
  return String(value ?? "");
}

export function QuizResult({
  score,
  total,
  results,
  onRestart,
}: QuizResultProps) {
  const [showAll, setShowAll] = useState(false);
  const pct = total ? Math.round((score / total) * 100) : 0;

  const typeStats: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    const t = r.question.type;
    if (!typeStats[t]) typeStats[t] = { correct: 0, total: 0 };
    typeStats[t].total++;
    if (r.correct) typeStats[t].correct++;
  }

  const typeEntries = Object.entries(typeStats).map(([type, stat]) => {
    const label = TYPE_LABELS[type] ?? type.replace(/_/g, " ");
    const percent = stat.total
      ? Math.round((stat.correct / stat.total) * 100)
      : 0;
    const toneClassName = TYPE_COLORS[type] ?? "bg-surface-soft";
    return {
      type,
      label,
      correct: stat.correct,
      total: stat.total,
      percent,
      toneClassName,
    };
  });

  const timedOutCount = results.filter((result) => result.timedOut).length;
  const incorrectCount = results.filter((result) => !result.correct).length;
  const topMistakes = useMemo(
    () =>
      results
        .filter((result) => result.timedOut || !result.correct)
        .slice(0, 5),
    [results],
  );

  const displayedResults = showAll ? results : topMistakes;
  const reviewTitle = showAll ? "All answers" : "Top mistakes";

  return (
    <View className="gap-4">
      <QuizResultSummaryCard
        score={score}
        total={total}
        percent={pct}
        correctCount={score}
        incorrectCount={incorrectCount}
        timedOutCount={timedOutCount}
      />

      <QuizTypeBreakdown entries={typeEntries} />

      <View className="flex-row items-center justify-between">
        <AppText variant="subtitle">{reviewTitle}</AppText>
        <AppButton
          title={showAll ? "Show less" : "All answers"}
          variant="secondary"
          className="min-h-9 px-0"
          onPress={() => setShowAll((prev) => !prev)}
        />
      </View>

      {displayedResults.length === 0 ? (
        <AppCard className="bg-mint-soft border-mint/50">
          <AppText variant="caption" className="text-text-muted">
            Great run. No mistakes to review.
          </AppText>
        </AppCard>
      ) : (
        displayedResults.map((result, i) => {
          const correct = formatCorrectAnswer(result.question.correct_answer);
          const typeLabel =
            TYPE_LABELS[result.question.type] ?? result.question.type;
          return (
            <QuizReviewItem
              key={result.question.id ?? i}
              result={result}
              typeLabel={typeLabel}
              correctAnswerText={correct}
              compact={showAll && result.correct}
            />
          );
        })
      )}

      <AppButton title="Restart quiz" onPress={onRestart} />
    </View>
  );
}
