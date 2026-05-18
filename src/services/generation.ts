import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { updateDeck } from "./decks";

export type GenerateDeckContentResult = {
  success: boolean;
  cards?: number;
  questions?: number;
};

async function getFunctionErrorMessage(error: unknown) {
  const fallback = getErrorMessage(error, "Could not generate deck content.");
  const context = (error as { context?: unknown })?.context;

  if (context instanceof Response) {
    const clone = context.clone();

    try {
      const payload = await clone.json();
      if (typeof payload?.error === "string" && payload.error.trim()) {
        return payload.error.trim();
      }
    } catch {
      // Fall through to text extraction.
    }

    try {
      const text = await context.text();
      if (text.trim()) return text.trim();
    } catch {
      // Keep fallback below.
    }
  }

  return fallback;
}

export async function generateDeckContent(deckId: string) {
  const { data, error } = await supabase.functions.invoke("generate-deck-content", {
    body: { deck_id: deckId },
  });

  if (error) {
    const message = await getFunctionErrorMessage(error);

    try {
      await updateDeck(deckId, {
        status: "Failed",
        generation_error: message,
      });
    } catch (updateError) {
      console.warn("Could not mark deck generation as failed.", updateError);
    }

    throw new Error(message);
  }

  return data as GenerateDeckContentResult;
}
