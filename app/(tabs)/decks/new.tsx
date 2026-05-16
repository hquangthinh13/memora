import { useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, DeckCoverPicker, Screen, TopicSelect } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { createDeck } from "@/services/decks";

export default function CreateDeckScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [selectedCoverUri, setSelectedCoverUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    if (!title.trim()) {
      setError("Deck title is required.");
      return;
    }
    if (!topicId) {
      setError("Choose a topic for this deck.");
      return;
    }
    if (!sourceText.trim()) {
      setError("Add source notes so AI can generate cards and questions.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const cover = selectedCoverUri
        ? await uploadImageToCloudinary({
            localUri: selectedCoverUri,
            folder: "memora/deck",
          })
        : null;
      const deck = await createDeck({
        owner_id: user.id,
        topic_id: topicId,
        title: title.trim(),
        description: description.trim() || null,
        cover_image_url: cover?.secureUrl ?? null,
        cover_image_public_id: cover?.publicId ?? null,
        source_type: "text",
        source_text: sourceText.trim(),
        source_file_path: null,
        status: "Preparing",
        generation_error: null,
      });
      router.replace(`/decks/${deck.id}?generate=1`);
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not save deck."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Create deck</AppText>
      <AppText variant="body" className="text-text-muted">
        Add source notes and let AI prepare cards and quiz questions.
      </AppText>

      <AppCard className="gap-4">
        <AppInput label="Deck title" placeholder="HTTP basics" value={title} onChangeText={setTitle} />
        <AppInput label="Description" placeholder="Short context for learners" value={description} onChangeText={setDescription} />
        <TopicSelect
          value={topicId}
          onChange={(id) => {
            setError(null);
            setTopicId(id);
          }}
          disabled={submitting}
        />
        <AppInput
          label="Source notes"
          placeholder="Paste notes, a topic summary, or learning material here."
          value={sourceText}
          onChangeText={setSourceText}
          multiline
          inputClassName="min-h-40 py-3"
          textAlignVertical="top"
        />
        <DeckCoverPicker
          imageUri={selectedCoverUri}
          disabled={submitting}
          onChange={(uri) => {
            setError(null);
            setSelectedCoverUri(uri);
          }}
          onRemove={() => setSelectedCoverUri(null)}
          onError={setError}
        />
        {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
        <AppButton
          title={submitting ? "Preparing deck..." : "Generate deck"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>
    </Screen>
  );
}
