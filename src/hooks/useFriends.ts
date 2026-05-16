import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  type FriendWithProfile,
  type UserProfile,
} from "@/services/friends";

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [incoming, setIncoming] = useState<FriendWithProfile[]>([]);
  const [outgoing, setOutgoing] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [f, inc, out] = await Promise.all([
        listFriends(),
        listIncomingRequests(),
        listOutgoingRequests(),
      ]);
      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load friends.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingCount = incoming.length;

  return {
    friends,
    incoming,
    outgoing,
    loading,
    error,
    pendingCount,
    refresh,
    // Actions — all call refresh() on success so state stays fresh
    sendFriendRequest: async (addresseeId: string) => {
      await sendFriendRequest(addresseeId);
      await refresh();
    },
    acceptFriendRequest: async (id: string) => {
      await acceptFriendRequest(id);
      await refresh();
    },
    rejectFriendRequest: async (id: string) => {
      await rejectFriendRequest(id);
      await refresh();
    },
    cancelFriendRequest: async (id: string) => {
      await cancelFriendRequest(id);
      await refresh();
    },
    removeFriend: async (id: string) => {
      await removeFriend(id);
      await refresh();
    },
  };
}

export function useFriendSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      setResults(await searchUsers(q));
    } finally {
      setLoading(false);
    }
  }, []);

  return { query, results, loading, search };
}
