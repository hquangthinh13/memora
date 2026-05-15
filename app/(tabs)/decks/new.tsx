import { useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { createDeck } from "@/services/decks";

export default function CreateDeckScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    if (!title.trim()) {
      setError("Deck title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const deck = await createDeck({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        language: language.trim() || null,
      });
      router.replace(`/decks/${deck.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save deck.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Create deck</AppText>
      <AppText variant="body" className="text-text-muted">
        Add a deck and start collecting cards.
      </AppText>

      <AppCard className="gap-4">
        <AppInput label="Deck title" placeholder="Travel phrases" value={title} onChangeText={setTitle} />
        <AppInput label="Description" placeholder="Short context for learners" value={description} onChangeText={setDescription} />
        <AppInput label="Language" placeholder="French" value={language} onChangeText={setLanguage} />
        {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
        <AppButton
          title={submitting ? "Saving..." : "Save deck"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>
    </Screen>
  );
}
