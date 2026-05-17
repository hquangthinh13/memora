import { useRouter } from "expo-router";
import { useState } from "react";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  DeckCoverPicker,
  Screen,
  TopicSelect,
  SectionHeader,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { createDeck } from "@/services/decks";
import { getTopic } from "@/services/topics";

export default function CreateDeckScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [topicId, setTopicId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [selectedCoverUri, setSelectedCoverUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!user) return;
    if (!topicId) {
      setError("Choose a topic for this deck.");
      return;
    }
    if (sourceText.trim().length < 20) {
      setError("Add at least a short description so AI can generate meaningful content.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const topic = await getTopic(topicId);
      if (!topic || topic.user_id !== user.id) {
        setError("Choose a topic from your own profile before generating this deck.");
        return;
      }

      const cover = selectedCoverUri
        ? await uploadImageToCloudinary({
            localUri: selectedCoverUri,
            folder: "memora/deck",
          })
        : null;
      const deck = await createDeck({
        owner_id: user.id,
        topic_id: topicId,
        title: "Preparing your deck...",
        description: null,
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
    <Screen
      header={<SectionHeader title="Create new deck"></SectionHeader>}
      scroll
    >
      <AppCard className="gap-4">
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
        <AppText variant="caption" className="text-secondary text-center">
          Memora will generate a title, description, and flashcards from your topic and notes.
        </AppText>
        {error ? (
          <AppText variant="caption" className="text-danger">
            {error}
          </AppText>
        ) : null}
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
