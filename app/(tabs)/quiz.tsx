import { useEffect, useRef } from "react";
import { useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { View } from "react-native";

import {
  AnswerInput,
  AppButton,
  AppText,
  EmptyState,
  LoadingState,
  QuestionProgressSegments,
  QuestionRenderer,
  QuizResult,
  Screen,
  SectionHeader,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useQuizSounds } from "@/hooks/useQuizSounds";
import { useQuizSession } from "@/hooks/useQuizSession";
import { recordQuizCompletion } from "@/services/learningProgress";

export default function QuizScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const quiz = useQuizSession(deckId, { enabled: isFocused });
  const quizSounds = useQuizSounds();

  // Guard so we record completion exactly once per quiz run (not on re-renders).
  const hasRecordedRef = useRef(false);
  const playedResultCountRef = useRef(0);
  const playedTickKeyRef = useRef<string | null>(null);
  const playedFinishRef = useRef(false);

  // Reset the guard whenever the quiz is not done (covers reset() and deckId change).
  useEffect(() => {
    if (!quiz.done) {
      hasRecordedRef.current = false;
      playedFinishRef.current = false;
    }
  }, [quiz.done]);

  useEffect(() => {
    if (!quiz.done || quiz.total <= 0) return;

    if (!playedFinishRef.current) {
      playedFinishRef.current = true;
      quizSounds.playFinish();
    }

    if (!hasRecordedRef.current && user) {
      hasRecordedRef.current = true;
      recordQuizCompletion(user.id, {
        questionsAnswered: quiz.total,
        correct: quiz.score,
        incorrect: quiz.wrongCount,
      }).catch(console.error);
    }
  }, [quiz.done, quiz.total, quiz.score, quiz.wrongCount, quizSounds, user]);
  const latestResult = quiz.results.at(-1);

  useEffect(() => {
    if (quiz.results.length === 0) {
      playedResultCountRef.current = 0;
      return;
    }

    if (quiz.results.length <= playedResultCountRef.current || !latestResult) return;

    playedResultCountRef.current = quiz.results.length;

    if (latestResult.timedOut) {
      quizSounds.playTimeout();
    } else if (latestResult.correct) {
      quizSounds.playCorrect();
    } else {
      quizSounds.playIncorrect();
    }
  }, [latestResult, quiz.results.length, quizSounds]);

  useEffect(() => {
    const questionId = quiz.currentQuestion?.id;
    if (
      !isFocused ||
      !questionId ||
      quiz.selectedAnswer ||
      quiz.done ||
      quiz.timeLeft <= 0 ||
      quiz.timeLeft > 5
    ) {
      return;
    }

    const tickKey = `${questionId}:${quiz.timeLeft}`;
    if (playedTickKeyRef.current === tickKey) return;

    playedTickKeyRef.current = tickKey;
    quizSounds.playTick();
  }, [
    isFocused,
    quiz.currentQuestion?.id,
    quiz.done,
    quiz.selectedAnswer,
    quiz.timeLeft,
    quizSounds,
  ]);

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
            answerResult={quiz.selectedAnswer ? latestResult : null}
            onAnswer={quiz.answer}
          />
          {quiz.selectedAnswer && latestResult ? (
            <AppButton
              title={quiz.index + 1 >= quiz.total ? "See result" : "Next question"}
              onPress={quiz.next}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
