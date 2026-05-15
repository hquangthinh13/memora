import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { getStudiedCardCount } from "@/services/study";

export function useLearningProgress() {
  const { user } = useAuth();
  const [studiedCount, setStudiedCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(user));

  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      setStudiedCount(await getStudiedCardCount(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { studiedCount, loading, refresh };
}
