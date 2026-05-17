import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { recordCardStudy } from "@/services/learningProgress";
import { getStudyCards, recordStudyAnswer } from "@/services/study";
import type { Tables } from "@/types/database";

export function useStudySession(deckId?: string) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Tables<"cards">[]>([]);
  const [index, setIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [loading, setLoading] = useState(Boolean(deckId));
  const [error, setError] = useState<string | null>(null);
  const studiedCardIdsRef = useRef<Set<string>>(new Set());
  const recordingCardIdsRef = useRef<Set<string>>(new Set());

  const toggleAnswer = useCallback(() => {
    setAnswerVisible((value) => !value);
  }, []);

  const currentCard = useMemo(() => cards[index] ?? null, [cards, index]);

  const next = useCallback(async () => {
    if (user && currentCard && answerVisible) {
      const alreadyRecorded = studiedCardIdsRef.current.has(currentCard.id);
      const alreadyRecording = recordingCardIdsRef.current.has(currentCard.id);

      if (!alreadyRecorded && !alreadyRecording) {
        recordingCardIdsRef.current.add(currentCard.id);

        try {
          await recordCardStudy({ userId: user.id, cardId: currentCard.id });
          studiedCardIdsRef.current.add(currentCard.id);
        } catch (caught) {
          console.error("Could not record study progress", caught);
        } finally {
          recordingCardIdsRef.current.delete(currentCard.id);
        }
      }
    }

    setAnswerVisible(false);
    setIndex((value) => Math.min(value + 1, cards.length));
  }, [answerVisible, cards.length, currentCard, user]);

  const previous = useCallback(() => {
    setAnswerVisible(false);
    setIndex((value) => Math.max(value - 1, 0));
  }, []);

  const refresh = useCallback(async () => {
    if (!deckId) return;

    setLoading(true);
    setError(null);

    try {
      setCards(await getStudyCards(deckId));
      setIndex(0);
      setAnswerVisible(false);
      studiedCardIdsRef.current = new Set();
      recordingCardIdsRef.current = new Set();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load study cards.",
      );
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  const reveal = useCallback(() => {
    setAnswerVisible(true);
  }, []);

  const answer = useCallback(
    async (correct: boolean) => {
      if (!user || !currentCard) return;

      await recordStudyAnswer({
        userId: user.id,
        cardId: currentCard.id,
        correct,
      });

      // Fire-and-forget: analytics tracking must not block the answer flow.
      recordCardStudy({ userId: user.id, cardId: currentCard.id }).catch(console.error);

      setAnswerVisible(false);
      setIndex((value) => Math.min(value + 1, cards.length));
    },
    [cards.length, currentCard, user],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    cards,
    currentCard,
    index,
    total: cards.length,
    done: cards.length > 0 && index >= cards.length,
    answerVisible,
    loading,
    error,
    refresh,
    reveal,
    answer,
    toggleAnswer,
    next,
    previous,
  };
}
