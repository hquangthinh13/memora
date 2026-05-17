import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { listPublishedDecksForOwners, type PublishedDeckSummary } from "@/services/decks";
import { listFriendsWithProgress, type FriendWithProgress } from "@/services/friends";

export type FriendSharedLibraryGroup = {
  friend: FriendWithProgress["friend"];
  progress: FriendWithProgress["progress"];
  decks: PublishedDeckSummary[];
};

export function useFriendSharedLibrary() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<FriendSharedLibraryGroup[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const friends = await listFriendsWithProgress();
      const ownerIds = friends.map((f) => f.friend.id);
      const decks = await listPublishedDecksForOwners(ownerIds);

      const decksByOwner = new Map<string, PublishedDeckSummary[]>();
      for (const deck of decks) {
        const prev = decksByOwner.get(deck.owner_id) ?? [];
        prev.push(deck);
        decksByOwner.set(deck.owner_id, prev);
      }

      setGroups(
        friends.map((f) => ({
          friend: f.friend,
          progress: f.progress,
          decks: decksByOwner.get(f.friend.id) ?? [],
        })),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load shared library.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    groups,
    loading,
    error,
    refresh,
  };
}

