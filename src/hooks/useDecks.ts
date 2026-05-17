import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { createDeck, listDecks, type DeckSummary } from "@/services/decks";
import type { Deck } from "@/services/decks";
import type { Inserts } from "@/types/database";

export function useDecks() {
  const { user } = useAuth();
  const channelInstanceId = useRef(
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  );
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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`decks:${user.id}:${channelInstanceId.current}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "decks",
          filter: `owner_id=eq.${user.id}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "decks",
          filter: `owner_id=eq.${user.id}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "decks",
        },
        (payload) => {
          const deleted = payload.old as Partial<Deck>;
          if (!deleted.id) return;

          setDecks((current) =>
            current.filter((deck) => deck.id !== deleted.id),
          );
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Could not subscribe to deck updates.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, user]);

  return { decks, loading, error, refresh, addDeck };
}
