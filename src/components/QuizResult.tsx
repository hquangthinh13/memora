import { View } from "react-native";

import type { QuizAnswerResult } from "@/hooks/useQuizSession";
import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

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

export function QuizResult({ score, total, results, onRestart }: QuizResultProps) {
  const pct = total ? Math.round((score / total) * 100) : 0;

  // Per-type breakdown
  const typeStats: Record<string, { correct: number; total: number }> = {};
  for (const r of results) {
    const t = r.question.type;
    if (!typeStats[t]) typeStats[t] = { correct: 0, total: 0 };
    typeStats[t].total++;
    if (r.correct) typeStats[t].correct++;
  }
  const typeEntries = Object.entries(typeStats);
  const hasMultipleTypes = typeEntries.length > 1;

  return (
    <View className="gap-4">
      {/* Score card */}
      <AppCard className="gap-3 bg-mint-soft">
        <AppText variant="subtitle">Quiz complete</AppText>
        <AppText variant="title" className="text-4xl">
          {score}/{total}
        </AppText>
        <AppText variant="caption">{pct}% correct</AppText>
      </AppCard>

      {/* Per-type breakdown — only shown when the deck had multiple types */}
      {hasMultipleTypes ? (
        <AppCard className="gap-3">
          <AppText variant="subtitle">Breakdown by type</AppText>
          <View className="gap-2">
            {typeEntries.map(([type, stat]) => {
              const label = TYPE_LABELS[type] ?? type.replace(/_/g, " ");
              const typePct = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
              const color = TYPE_COLORS[type] ?? "bg-surface-soft";
              return (
                <View key={type} className="flex-row items-center gap-3">
                  <View className={`rounded-lg px-3 py-1 ${color}`} style={{ minWidth: 140 }}>
                    <AppText variant="caption" className="font-sans-semibold">
                      {label}
                    </AppText>
                  </View>
                  <AppText variant="caption">
                    {stat.correct}/{stat.total} ({typePct}%)
                  </AppText>
                </View>
              );
            })}
          </View>
        </AppCard>
      ) : null}

      {/* Per-question review */}
      {results.map((result, i) => {
        const correct = formatCorrectAnswer(result.question.correct_answer);
        return (
          <AppCard
            key={result.question.id ?? i}
            className={`gap-2 ${result.correct ? "border-mint" : "border-border"}`}
          >
            <View className="flex-row items-center justify-between">
              <AppText
                variant="caption"
                className={`font-sans-semibold ${result.correct ? "text-text" : "text-danger"}`}
              >
                {result.timedOut ? "Time's up" : result.correct ? "Correct" : "Incorrect"}
              </AppText>
              <AppText variant="caption" className="text-text-muted">
                {TYPE_LABELS[result.question.type] ?? result.question.type}
              </AppText>
            </View>

            <AppText variant="caption" className="text-text-muted">
              {result.question.question}
            </AppText>

            {!result.correct || result.timedOut ? (
              <>
                {!result.timedOut ? (
                  <AppText variant="caption">Your answer: {result.answer}</AppText>
                ) : null}
                <AppText variant="caption" className="font-sans-semibold">
                  Correct: {correct}
                </AppText>
              </>
            ) : (
              <AppText variant="caption">Your answer: {result.answer}</AppText>
            )}
          </AppCard>
        );
      })}

      <AppButton title="Restart quiz" onPress={onRestart} />
    </View>
  );
}
