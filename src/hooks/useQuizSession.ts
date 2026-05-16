import { useCallback, useEffect, useMemo, useState } from "react";

import { useQuestions } from "@/hooks/useQuestions";
import type { Question } from "@/services/questions";

export type QuizAnswerResult = {
  question: Question;
  answer: string;
  correct: boolean;
  elapsedMs: number;
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

export function useQuizSession(deckId?: string) {
  const questionsState = useQuestions(deckId);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<QuizAnswerResult[]>([]);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  const currentQuestion = questionsState.questions[index] ?? null;
  const options = useMemo(() => {
    if (!currentQuestion) return [];
    if (currentQuestion.type === "true_false") return ["True", "False"];
    if (currentQuestion.type !== "mcq") return [];

    const [correct] = asAcceptedAnswers(currentQuestion.correct_answer);
    return shuffle([correct, ...currentQuestion.wrong_answers].filter(Boolean));
  }, [currentQuestion]);
  const score = results.filter((result) => result.correct).length;
  const done = questionsState.questions.length > 0 && index >= questionsState.questions.length;

  const answer = useCallback(
    (value: string) => {
      if (!currentQuestion || selectedAnswer !== null) return;

      const elapsedMs = Date.now() - questionStartedAt;
      const correct = isCorrectAnswer(currentQuestion, value);

      setSelectedAnswer(value);
      setResults((items) => [
        ...items,
        {
          question: currentQuestion,
          answer: value,
          correct,
          elapsedMs,
        },
      ]);
    },
    [currentQuestion, questionStartedAt, selectedAnswer],
  );

  const next = useCallback(() => {
    setSelectedAnswer(null);
    setQuestionStartedAt(Date.now());
    setIndex((value) => Math.min(value + 1, questionsState.questions.length));
  }, [questionsState.questions.length]);

  const reset = useCallback(() => {
    setIndex(0);
    setSelectedAnswer(null);
    setResults([]);
    setQuestionStartedAt(Date.now());
  }, []);

  useEffect(() => {
    reset();
  }, [deckId, reset]);

  return {
    ...questionsState,
    currentQuestion,
    index,
    total: questionsState.questions.length,
    options,
    selectedAnswer,
    results,
    score,
    done,
    answer,
    next,
    reset,
  };
}
