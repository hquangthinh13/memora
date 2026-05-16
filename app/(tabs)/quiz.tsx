import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
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
  SectionHeader,
  ConfirmDialog,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useQuizSession } from "@/hooks/useQuizSession";
import { recordQuizCompletion } from "@/services/learningProgress";

export default function QuizScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const quiz = useQuizSession(deckId, { enabled: isFocused });

  // Guard so we record completion exactly once per quiz run (not on re-renders).
  const hasRecordedRef = useRef(false);

  // Reset the guard whenever the quiz is not done (covers reset() and deckId change).
  useEffect(() => {
    if (!quiz.done) {
      hasRecordedRef.current = false;
    }
  }, [quiz.done]);

  useEffect(() => {
    if (quiz.done && quiz.total > 0 && !hasRecordedRef.current && user) {
      hasRecordedRef.current = true;
      recordQuizCompletion(user.id, {
        questionsAnswered: quiz.total,
        correct: quiz.score,
        incorrect: quiz.wrongCount,
      }).catch(console.error);
    }
  }, [quiz.done, quiz.total, quiz.score, quiz.wrongCount, user]);
  const latestResult = quiz.results.at(-1);

  const correctAnswer = Array.isArray(latestResult?.question.correct_answer)
    ? latestResult?.question.correct_answer.join(", ")
    : latestResult?.question.correct_answer;

  const resultTitle = latestResult?.timedOut
    ? "Time's up"
    : latestResult?.correct
      ? "Correct"
      : "Incorrect";

  const resultDescription = latestResult?.timedOut
    ? "You didn't answer this question before the timer ran out."
    : latestResult?.correct
      ? `Your answer: ${quiz.selectedAnswer}`
      : `Your answer: ${quiz.selectedAnswer}\n\nCorrect answer: ${correctAnswer}`;
  return (
    <Screen
      scroll
      header={
        <SectionHeader
          backHref={`/decks/${deckId}`}
          variant="detail"
          title={"Quiz session"}
        />
      }
    >
      {!deckId ? (
        <EmptyState
          title="Choose a deck first"
          description="Open a ready deck and start the quiz from there."
        />
      ) : null}

      {quiz.loading ? (
        <AppText variant="caption">Loading questions...</AppText>
      ) : null}
      {quiz.error ? (
        <AppText variant="caption" className="text-danger">
          {quiz.error}
        </AppText>
      ) : null}

      {!quiz.loading && deckId && quiz.total === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Generate content for this deck before starting a quiz."
        />
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
            timeLeft={quiz.timeLeft}
            timeLimit={quiz.timeLimit}
            score={quiz.score}
            wrongCount={quiz.wrongCount}
          />

          <AnswerInput
            question={quiz.currentQuestion}
            options={quiz.options}
            selectedAnswer={quiz.selectedAnswer}
            onAnswer={quiz.answer}
          />

          {/* {quiz.selectedAnswer ? (
            <AppCard className="gap-3 rounded-3xl bg-surface-soft">
              <AppText variant="body" className="font-sans-semibold">
                {quiz.results[quiz.results.length - 1]?.timedOut
                  ? "Time's up"
                  : quiz.results[quiz.results.length - 1]?.correct
                    ? "Correct"
                    : "Review this one"}
              </AppText>

              <AppText variant="caption">
                Your answer: {quiz.selectedAnswer}
              </AppText>

              <View className="flex-row gap-2">
                <View className="flex-1 rounded-2xl bg-mint-soft px-4 py-3">
                  <AppText variant="caption">Correct</AppText>
                  <AppText variant="subtitle">{quiz.score}</AppText>
                </View>

                <View className="flex-1 rounded-2xl bg-pink-soft px-4 py-3">
                  <AppText variant="caption">Wrong</AppText>
                  <AppText variant="subtitle">{quiz.wrongCount}</AppText>
                </View>
              </View>

              <AppButton
                title={
                  quiz.index + 1 >= quiz.total ? "See result" : "Next question"
                }
                onPress={quiz.next}
              />
            </AppCard>
          ) : null} */}
          <ConfirmDialog
            visible={Boolean(quiz.selectedAnswer && latestResult)}
            title={resultTitle}
            description={resultDescription}
            confirmTitle={
              quiz.index + 1 >= quiz.total ? "See result" : "Next question"
            }
            hideCancel
            onCancel={quiz.next}
            onConfirm={quiz.next}
          />
        </View>
      ) : null}
    </Screen>
  );
}
