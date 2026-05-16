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

export function QuizResult({ score, total, results, onRestart }: QuizResultProps) {
  return (
    <View className="gap-4">
      <AppCard className="gap-3 bg-mint-soft">
        <AppText variant="subtitle">Quiz complete</AppText>
        <AppText variant="title">
          {score}/{total}
        </AppText>
        <AppText variant="caption">Review your answers below.</AppText>
      </AppCard>

      {results.map((result) => (
        <AppCard key={result.question.id} className="gap-2">
          <AppText variant="body" className="font-sans-semibold">
            {result.correct ? "Correct" : "Review"}
          </AppText>
          <AppText variant="caption">{result.question.question}</AppText>
          <AppText variant="caption">Your answer: {result.answer}</AppText>
        </AppCard>
      ))}

      <AppButton title="Restart quiz" onPress={onRestart} />
    </View>
  );
}
