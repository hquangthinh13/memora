import { useCallback, useEffect, useState } from "react";

import { listMyPublishedDecks, type PublishedDeckSummary } from "@/services/decks";

const PAGE_SIZE = 10;

export function usePublishedDecks() {
  const [items, setItems] = useState<PublishedDeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = await listMyPublishedDecks({ limit: PAGE_SIZE, offset: 0 });
      setItems(page.items);
      setHasMore(page.hasMore);
      setTotalCount(page.totalCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load published decks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const page = await listMyPublishedDecks({
        limit: PAGE_SIZE,
        offset: items.length,
      });
      setItems((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setTotalCount(page.totalCount);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load more published decks.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, items.length, loading, loadingMore]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    error,
    refresh,
    loadMore,
  };
}
