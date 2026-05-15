import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { listCollaborativeDecks, listDecks, listSavedDecks, type DeckSummary } from "@/services/decks";
import { listFriendships, type Friendship } from "@/services/social";

export function useProfileOverview() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [savedDecks, setSavedDecks] = useState<unknown[]>([]);
  const [collaborativeDecks, setCollaborativeDecks] = useState<unknown[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextDecks, nextSavedDecks, nextCollaborativeDecks, nextFriendships] =
        await Promise.all([
          listDecks(),
          listSavedDecks(),
          listCollaborativeDecks(),
          listFriendships(),
        ]);

      setDecks(nextDecks);
      setSavedDecks(nextSavedDecks);
      setCollaborativeDecks(nextCollaborativeDecks);
      setFriendships(nextFriendships);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const publishedDecks = useMemo(
    () =>
      decks.filter(
        (deck) => deck.owner_id === user?.id && deck.visibility === "PUBLIC",
      ),
    [decks, user?.id],
  );

  const friendCount = friendships.filter(
    (friendship) => friendship.status === "accepted",
  ).length;

  return {
    loading,
    error,
    friendCount,
    publishedDecks,
    savedDecks,
    collaborativeDecks,
    refresh,
  };
}
