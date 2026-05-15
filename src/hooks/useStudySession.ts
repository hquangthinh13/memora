import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getStudyCards, recordStudyAnswer } from "@/services/study";
import type { Tables } from "@/types/database";

export function useStudySession(deckId?: string) {
  const { user } = useAuth();
  const [cards, setCards] = useState<Tables<"cards">[]>([]);
  const [index, setIndex] = useState(0);
  const [answerVisible, setAnswerVisible] = useState(false);
  const [loading, setLoading] = useState(Boolean(deckId));
  const [error, setError] = useState<string | null>(null);

  const currentCard = useMemo(() => cards[index] ?? null, [cards, index]);

  const refresh = useCallback(async () => {
    if (!deckId) return;

    setLoading(true);
    setError(null);

    try {
      setCards(await getStudyCards(deckId));
      setIndex(0);
      setAnswerVisible(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load study cards.");
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
  };
}
