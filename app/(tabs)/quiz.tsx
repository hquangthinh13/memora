import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import {
  AnswerInput,
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  QuestionRenderer,
  QuizResult,
  Screen,
} from "@/components";
import { useQuizSession } from "@/hooks/useQuizSession";

export default function QuizScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const quiz = useQuizSession(deckId);

  return (
    <Screen scroll contentClassName="pb-32">
      <AppText variant="title">Quiz</AppText>

      {!deckId ? (
        <EmptyState title="Choose a deck first" description="Open a ready deck and start the quiz from there." />
      ) : null}

      {quiz.loading ? <AppText variant="caption">Loading questions...</AppText> : null}
      {quiz.error ? <AppText variant="caption" className="text-danger">{quiz.error}</AppText> : null}

      {!quiz.loading && deckId && quiz.total === 0 ? (
        <EmptyState title="No questions yet" description="Generate content for this deck before starting a quiz." />
      ) : null}

      {quiz.done ? (
        <QuizResult
          score={quiz.score}
          total={quiz.total}
          results={quiz.results}
          onRestart={quiz.reset}
        />
      ) : null}

      {quiz.currentQuestion && !quiz.done ? (
        <View className="gap-4">
          <QuestionRenderer
            question={quiz.currentQuestion}
            index={quiz.index}
            total={quiz.total}
          />
          <AnswerInput
            question={quiz.currentQuestion}
            options={quiz.options}
            selectedAnswer={quiz.selectedAnswer}
            onAnswer={quiz.answer}
          />
          {quiz.selectedAnswer ? (
            <AppCard className="gap-3 bg-surface-soft">
              <AppText variant="body" className="font-sans-semibold">
                {quiz.results[quiz.results.length - 1]?.correct ? "Correct" : "Review this one"}
              </AppText>
              <AppText variant="caption">
                Your answer: {quiz.selectedAnswer}
              </AppText>
              <AppButton
                title={quiz.index + 1 >= quiz.total ? "See result" : "Next question"}
                onPress={quiz.next}
              />
            </AppCard>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
