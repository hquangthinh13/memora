import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { View } from "react-native";

import {
  AnswerInput,
  AppText,
  EmptyState,
  LoadingState,
  QuestionProgressSegments,
  QuestionRenderer,
  ResultAnswerSection,
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

  const correctAnswerText = Array.isArray(latestResult?.question.correct_answer)
    ? latestResult?.question.correct_answer.join(", ")
    : String(latestResult?.question.correct_answer ?? "");
  const selectedAnswerText = String(quiz.selectedAnswer ?? "");

  const resultTitle = latestResult?.timedOut
    ? "Time's up"
    : latestResult?.correct
      ? "Correct"
      : "Incorrect";
  const resultTone = latestResult?.timedOut
    ? {
        cardClassName: "",
        titleClassName: "",
      }
    : latestResult?.correct
      ? {
          cardClassName: "",
          titleClassName: "",
        }
      : {
          cardClassName: "",
          titleClassName: "",
        };
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
        <LoadingState label="Loading questions..." center={false} />
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
          <QuestionProgressSegments
            currentIndex={quiz.index}
            total={quiz.total}
          />

          <QuestionRenderer
            question={quiz.currentQuestion}
            index={quiz.index}
            total={quiz.total}
            timeLeft={quiz.timeLeft}
            timeLimit={quiz.timeLimit}
            score={quiz.score}
            wrongCount={quiz.wrongCount}
            showIllustration
          />

          <AnswerInput
            question={quiz.currentQuestion}
            options={quiz.options}
            selectedAnswer={quiz.selectedAnswer}
            onAnswer={quiz.answer}
          />
          <ConfirmDialog
            visible={Boolean(quiz.selectedAnswer && latestResult)}
            title={resultTitle}
            cardClassName={resultTone.cardClassName}
            titleClassName={resultTone.titleClassName}
            confirmTitle={
              quiz.index + 1 >= quiz.total ? "See result" : "Next question"
            }
            hideCancel
            onCancel={quiz.next}
            onConfirm={quiz.next}
            children={
              <View className="gap-2 my-6">
                <ResultAnswerSection
                  label="Your answer"
                  value={
                    latestResult?.timedOut ? "Timed out" : selectedAnswerText
                  }
                  className={
                    latestResult?.correct
                      ? "border-peach bg-peach-soft"
                      : "border-peach bg-peach-soft"
                  }
                />

                <View className="h-px bg-border/80" />

                <ResultAnswerSection
                  label="Correct answer"
                  value={correctAnswerText}
                  className="bg-mint-soft border-mint"
                />
              </View>
            }
          />
        </View>
      ) : null}
    </Screen>
  );
}
