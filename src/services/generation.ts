import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { updateDeck } from "./decks";

export type GenerateDeckContentResult = {
  success: boolean;
  cards?: number;
  questions?: number;
};

export async function generateDeckContent(deckId: string) {
  const { data, error } = await supabase.functions.invoke("generate-deck-content", {
    body: { deck_id: deckId },
  });

  if (error) {
    const message = getErrorMessage(error, "Could not generate deck content.");

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
