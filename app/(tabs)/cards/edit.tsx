import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, Screen } from "@/components";
import { createCard } from "@/services/cards";

export default function EditCardScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [hint, setHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!deckId) {
      setError("Missing deck id.");
      return;
    }

    if (!term.trim() && !definition.trim()) {
      setError("Add a term or definition.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createCard({
        deck_id: deckId,
        term: term.trim() || null,
        definition: definition.trim() || null,
        hint: hint.trim() || null,
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
        Add the front, answer, and a small hint.
      </AppText>

      <AppCard className="gap-4">
        <AppInput label="Term" placeholder="Bonjour" value={term} onChangeText={setTerm} />
        <AppInput label="Definition" placeholder="Hello" value={definition} onChangeText={setDefinition} />
        <AppInput label="Hint" placeholder="Common greeting" value={hint} onChangeText={setHint} />
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
