import { useCallback, useEffect, useState } from "react";

import { listOpenRooms, type OpenRoom } from "@/services/rooms";

export function useRooms() {
  const [rooms, setRooms] = useState<OpenRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setRooms(await listOpenRooms());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load rooms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rooms, loading, error, refresh };
}
