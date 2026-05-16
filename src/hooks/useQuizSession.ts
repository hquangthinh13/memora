import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQuestions } from "@/hooks/useQuestions";
import type { Question } from "@/services/questions";

export type QuizAnswerResult = {
  question: Question;
  answer: string;
  correct: boolean;
  elapsedMs: number;
  timedOut?: boolean;
};

function asAcceptedAnswers(value: Question["correct_answer"]) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function shuffle(values: string[]) {
  return [...values].sort(() => Math.random() - 0.5);
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase();
}

function isCorrectAnswer(question: Question, answer: string) {
  const normalized = normalizeAnswer(answer);
  return asAcceptedAnswers(question.correct_answer).some(
    (accepted) => normalizeAnswer(accepted) === normalized,
  );
}

// const AUTO_NEXT_DELAY_MS = 900;

export function useQuizSession(deckId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  const questionsState = useQuestions(deckId);

  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<QuizAnswerResult[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState(0);

  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const currentQuestion = questionsState.questions[index] ?? null;

  const timeLimit = currentQuestion?.time_limit ?? 0;

  const options = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.type === "true_false") return ["True", "False"];
    if (currentQuestion.type !== "mcq") return [];

    const [correct] = asAcceptedAnswers(currentQuestion.correct_answer);
    return shuffle([correct, ...currentQuestion.wrong_answers].filter(Boolean));
  }, [currentQuestion]);

  const score = results.filter((result) => result.correct).length;
  const wrongCount = results.filter((result) => !result.correct).length;
  const answeredCount = results.length;
  const done =
    questionsState.questions.length > 0 &&
    index >= questionsState.questions.length;

  const next = useCallback(() => {
    setSelectedAnswer(null);
    setQuestionStartedAt(Date.now());
    setIndex((value) => Math.min(value + 1, questionsState.questions.length));
  }, [questionsState.questions.length]);

  const recordAnswer = useCallback(
    (value: string, timedOut = false) => {
      if (!currentQuestion || selectedAnswer !== null) return;

      const elapsedMs = Date.now() - questionStartedAt;
      const correct = !timedOut && isCorrectAnswer(currentQuestion, value);

      setSelectedAnswer(value);
      setResults((items) => [
        ...items,
        {
          question: currentQuestion,
          answer: value,
          correct,
          elapsedMs,
          timedOut,
        },
      ]);
    },
    [currentQuestion, questionStartedAt, selectedAnswer],
  );
  const answer = useCallback(
    (value: string) => {
      recordAnswer(value, false);
    },
    [recordAnswer],
  );

  const timeout = useCallback(() => {
    recordAnswer("Timed out", true);
  }, [recordAnswer]);

  const reset = useCallback(() => {
    setIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setQuestionStartedAt(Date.now());
  }, []);

  useEffect(() => {
    reset();
  }, [deckId, reset]);

  // When the screen loses focus, collapse any open dialog and freeze the timer.
  useEffect(() => {
    if (!enabled) {
      setSelectedAnswer(null);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !currentQuestion || selectedAnswer || done) return;

    setTimeLeft(timeLimit);

    if (!timeLimit || timeLimit <= 0) return;

    const interval = setInterval(() => {
      if (!enabledRef.current) {
        clearInterval(interval);
        return;
      }

      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(interval);
          if (enabledRef.current) timeout();
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, currentQuestion?.id, selectedAnswer, done, timeLimit, timeout]);

  return {
    ...questionsState,
    currentQuestion,
    index,
    total: questionsState.questions.length,
    options,
    selectedAnswer,
    results,
    score,
    wrongCount,
    answeredCount,
    timeLeft,
    timeLimit,
    done,
    answer,
    next,
    reset,
  };
}
