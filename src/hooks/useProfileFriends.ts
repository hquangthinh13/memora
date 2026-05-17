import { useCallback, useEffect, useState } from "react";

import { listFriends, type FriendWithProfile } from "@/services/friends";
import { useAuth } from "@/hooks/useAuth";

const PREVIEW_LIMIT = 20;

export function useProfileFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [friendCount, setFriendCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allFriends = await listFriends();
      setFriendCount(allFriends.length);
      setFriends(allFriends.slice(0, PREVIEW_LIMIT));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load friends.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    friends,
    friendCount,
    loading,
    error,
    refresh,
  };
}
