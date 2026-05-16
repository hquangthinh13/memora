import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";

import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import {
  createTopic,
  deleteTopic,
  listTopics,
  updateTopic,
  type Topic,
} from "@/services/topics";
import type { Inserts, Updates } from "@/types/database";

export function useTopics() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setTopics(await listTopics());
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not load topics."));
    } finally {
      setLoading(false);
    }
  }, []);

  const addTopic = useCallback(
    async (topic: Omit<Inserts<"topics">, "user_id">) => {
      if (!user) throw new Error("You need to be logged in.");

      const created = await createTopic({ ...topic, user_id: user.id });
      await refresh();
      return created;
    },
    [refresh, user],
  );

  const saveTopic = useCallback(
    async (topicId: string, updates: Updates<"topics">) => {
      const updated = await updateTopic(topicId, updates);
      await refresh();
      return updated;
    },
    [refresh],
  );

  const removeTopic = useCallback(
    async (topicId: string) => {
      await deleteTopic(topicId);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { topics, loading, error, refresh, addTopic, saveTopic, removeTopic };
}
