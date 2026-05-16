import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, Screen } from "@/components";
import { createCanonicalCard } from "@/services/cards";

export default function EditCardScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!deckId) {
      setError("Missing deck id.");
      return;
    }

    if (!front.trim() || !back.trim()) {
      setError("Add both a front and back.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createCanonicalCard({
        deck_id: deckId,
        front: front.trim(),
        back: back.trim(),
        explanation: explanation.trim() || null,
      });
      router.replace(`/decks/${deckId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save card.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Create card</AppText>
      <AppText variant="body" className="text-text-muted">
        Add the prompt, answer, and explanation.
      </AppText>

      <AppCard className="gap-4">
        <AppInput label="Front" placeholder="What does HTTP 404 mean?" value={front} onChangeText={setFront} />
        <AppInput label="Back" placeholder="Resource not found" value={back} onChangeText={setBack} />
        <AppInput
          label="Explanation"
          placeholder="HTTP 404 means the server could not find the requested resource."
          value={explanation}
          onChangeText={setExplanation}
          multiline
          inputClassName="min-h-28 py-3"
          textAlignVertical="top"
        />
        {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
        <AppButton
          title={submitting ? "Saving..." : "Save card"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>
    </Screen>
  );
}
