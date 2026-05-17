import { useCallback, useEffect, useMemo, useState } from "react";

import { createTopic, listTopicDeckCounts, listTopicsPage, type Topic } from "@/services/topics";
import { useAuth } from "@/hooks/useAuth";

export type TopicListItem = Topic & {
  deck_count?: number;
};

const PAGE_SIZE = 10;

export function usePaginatedTopics() {
  const { user } = useAuth();
  const [items, setItems] = useState<TopicListItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(Boolean(user));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const enrichWithCounts = useCallback(async (topics: Topic[]) => {
    if (!topics.length) return [] as TopicListItem[];

    const counts = await listTopicDeckCounts(topics.map((topic) => topic.id));
    return topics.map((topic) => ({
      ...topic,
      deck_count: counts.get(topic.id) ?? 0,
    }));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setHasMore(false);
      setLoadingInitial(false);
      return;
    }

    setLoadingInitial(true);
    setError(null);

    try {
      const page = await listTopicsPage({ limit: PAGE_SIZE, offset: 0 });
      const enriched = await enrichWithCounts(page.items);
      setItems(enriched);
      setHasMore(page.hasMore);
      setTotalCount(page.totalCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load topics.");
    } finally {
      setLoadingInitial(false);
    }
  }, [enrichWithCounts, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (!user || loadingMore || loadingInitial || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const page = await listTopicsPage({
        limit: PAGE_SIZE,
        offset: items.length,
      });
      const enriched = await enrichWithCounts(page.items);
      setItems((prev) => [...prev, ...enriched]);
      setHasMore(page.hasMore);
      setTotalCount(page.totalCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load more topics.");
    } finally {
      setLoadingMore(false);
    }
  }, [enrichWithCounts, hasMore, items.length, loadingInitial, loadingMore, user]);

  const createAndPrepend = useCallback(
    async ({ name, description }: { name: string; description?: string | null }) => {
      if (!user) throw new Error("You need to be logged in.");

      const created = await createTopic({
        user_id: user.id,
        name,
        description: description ?? null,
      });

      setItems((prev) => [
        {
          ...created,
          deck_count: 0,
        },
        ...prev,
      ]);
      setTotalCount((prev) => prev + 1);

      return created;
    },
    [user],
  );

  const topicCount = useMemo(() => totalCount, [totalCount]);

  return {
    items,
    loadingInitial,
    loadingMore,
    hasMore,
    error,
    topicCount,
    refresh,
    loadMore,
    createAndPrepend,
  };
}
