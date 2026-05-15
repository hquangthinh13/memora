import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { AppButton, AppCard, AppInput, AppText, Screen } from "@/components";
import { useDeckDetail } from "@/hooks/useDeckDetail";

export default function EditDeckScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { deck, loading, error, saveDeck } = useDeckDetail(deckId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!deck) return;
    setTitle(deck.title);
    setDescription(deck.description ?? "");
    setLanguage(deck.language ?? "");
  }, [deck]);

  async function handleSave() {
    if (!title.trim()) {
      setSubmitError("Deck title is required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await saveDeck({
        title: title.trim(),
        description: description.trim() || null,
        language: language.trim() || null,
      });
      router.replace(`/decks/${deckId}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not save deck.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Edit deck</AppText>
      <AppText variant="body" className="text-text-muted">
        Update this deck&apos;s basic details.
      </AppText>

      {loading ? <AppText variant="caption">Loading deck...</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      <AppCard className="gap-4">
        <AppInput label="Deck title" placeholder="Travel phrases" value={title} onChangeText={setTitle} />
        <AppInput label="Description" placeholder="Everyday phrases for trips" value={description} onChangeText={setDescription} />
        <AppInput label="Language" placeholder="French" value={language} onChangeText={setLanguage} />
        {submitError ? <AppText variant="caption" className="text-danger">{submitError}</AppText> : null}
        <AppButton
          title={submitting ? "Saving..." : "Save changes"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>
    </Screen>
  );
}
