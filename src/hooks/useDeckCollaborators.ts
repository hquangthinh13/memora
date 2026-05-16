import { useCallback, useEffect, useState } from "react";

import {
  inviteFriendToDeck,
  listDeckCollaboratorsWithProfiles,
  removeCollaborator,
  updateCollaboratorRole,
  type CollaboratorRole,
  type CollaboratorWithProfile,
} from "@/services/deckCollaborators";

export function useDeckCollaborators(deckId?: string) {
  const [collaborators, setCollaborators] = useState<CollaboratorWithProfile[]>([]);
  const [loading, setLoading] = useState(Boolean(deckId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!deckId) return;
    setLoading(true);
    setError(null);
    try {
      setCollaborators(await listDeckCollaboratorsWithProfiles(deckId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load collaborators.");
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    collaborators,
    loading,
    error,
    refresh,
    inviteFriend: async (userId: string, role: CollaboratorRole) => {
      if (!deckId) return;
      await inviteFriendToDeck(deckId, userId, role);
      await refresh();
    },
    removeCollaborator: async (collaboratorId: string) => {
      await removeCollaborator(collaboratorId);
      await refresh();
    },
    changeRole: async (collaboratorId: string, role: CollaboratorRole) => {
      await updateCollaboratorRole(collaboratorId, role);
      await refresh();
    },
  };
}
