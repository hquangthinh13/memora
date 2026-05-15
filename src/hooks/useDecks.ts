import { useCallback, useEffect, useState } from "react";

import { createDeck, listDecks, type DeckSummary } from "@/services/decks";
import type { Inserts } from "@/types/database";

export function useDecks() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setDecks(await listDecks());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load decks.");
    } finally {
      setLoading(false);
    }
  }, []);

  const addDeck = useCallback(
    async (deck: Inserts<"decks">) => {
      const created = await createDeck(deck);
      await refresh();
      return created;
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { decks, loading, error, refresh, addDeck };
}
