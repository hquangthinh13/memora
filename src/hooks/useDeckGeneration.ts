import { useCallback, useState } from "react";

import { getErrorMessage } from "@/lib/errors";
import { generateDeckContent } from "@/services/generation";

export function useDeckGeneration(deckId?: string) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!deckId) throw new Error("Missing deck id.");

    setGenerating(true);
    setError(null);

    try {
      return await generateDeckContent(deckId);
    } catch (caught) {
      const message = getErrorMessage(caught, "Could not generate deck content.");
      setError(message);
      throw new Error(message);
    } finally {
      setGenerating(false);
    }
  }, [deckId]);

  return { generate, generating, error };
}
