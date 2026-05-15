import { useCallback, useEffect, useState } from "react";

import { getDeckDetail, updateDeck, type DeckWithCards } from "@/services/decks";
import type { Updates } from "@/types/database";

export function useDeckDetail(deckId?: string) {
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const [loading, setLoading] = useState(Boolean(deckId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!deckId) return;

    setLoading(true);
    setError(null);

    try {
      setDeck(await getDeckDetail(deckId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load deck.");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  const saveDeck = useCallback(
    async (updates: Updates<"decks">) => {
      if (!deckId) throw new Error("Missing deck id.");

      const updated = await updateDeck(deckId, updates);
      await refresh();
      return updated;
    },
    [deckId, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { deck, loading, error, refresh, saveDeck };
}
