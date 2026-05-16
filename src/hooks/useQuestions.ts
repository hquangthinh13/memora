import { useCallback, useEffect, useState } from "react";

import { getErrorMessage } from "@/lib/errors";
import { listQuestions, type Question } from "@/services/questions";

export function useQuestions(deckId?: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(Boolean(deckId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!deckId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setQuestions(await listQuestions(deckId));
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not load questions."));
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { questions, loading, error, refresh };
}
