import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  acceptDeckInvite,
  listMyDeckInvites,
  rejectDeckInvite,
  type DeckInvite,
} from "@/services/deckCollaborators";

export function useDeckInvites() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<DeckInvite[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      setInvites(await listMyDeckInvites());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invites.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    invites,
    loading,
    error,
    pendingCount: invites.length,
    refresh,
    acceptInvite: async (inviteId: string) => {
      await acceptDeckInvite(inviteId);
      await refresh();
    },
    rejectInvite: async (inviteId: string) => {
      await rejectDeckInvite(inviteId);
      await refresh();
    },
  };
}
