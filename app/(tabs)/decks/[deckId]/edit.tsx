import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { AppButton, AppCard, AppInput, AppText, DeckCoverPicker, Screen } from "@/components";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { getErrorMessage } from "@/lib/errors";
import { safelyDeleteCloudinaryImage, uploadImageToCloudinary } from "@/services/cloudinary";

export default function EditDeckScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { deck, loading, error, saveDeck } = useDeckDetail(deckId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [selectedCoverUri, setSelectedCoverUri] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!deck) return;
    setTitle(deck.title);
    setDescription(deck.description ?? "");
    setLanguage(deck.language ?? "");
    setSelectedCoverUri(null);
    setCoverRemoved(false);
  }, [deck]);

  async function handleSave() {
    if (!title.trim()) {
      setSubmitError("Deck title is required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setWarning(null);

    try {
      const previousPublicId = deck?.cover_image_public_id;
      const uploadedCover = selectedCoverUri
        ? await uploadImageToCloudinary({
            localUri: selectedCoverUri,
            folder: "memora/deck",
          })
        : null;
      const shouldClearCover = coverRemoved && !selectedCoverUri;

      await saveDeck({
        title: title.trim(),
        description: description.trim() || null,
        language: language.trim() || null,
        ...(uploadedCover
          ? {
              cover_image_url: uploadedCover.secureUrl,
              cover_image_public_id: uploadedCover.publicId,
            }
          : shouldClearCover
            ? {
                cover_image_url: null,
                cover_image_public_id: null,
              }
            : {}),
      });

      if ((uploadedCover || shouldClearCover) && previousPublicId) {
        const deleteWarning = await safelyDeleteCloudinaryImage({
          deckId,
          publicId: previousPublicId,
        });

        if (deleteWarning) {
          setWarning(deleteWarning);
        }
      }

      router.replace(`/decks/${deckId}`);
    } catch (caught) {
      setSubmitError(getErrorMessage(caught, "Could not save deck."));
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
        <DeckCoverPicker
          imageUri={selectedCoverUri ?? (coverRemoved ? null : deck?.cover_image_url ?? deck?.cover_url)}
          disabled={submitting}
          onChange={(uri) => {
            setSubmitError(null);
            setWarning(null);
            setSelectedCoverUri(uri);
            setCoverRemoved(false);
          }}
          onRemove={() => {
            setSelectedCoverUri(null);
            setCoverRemoved(true);
          }}
          onError={setSubmitError}
        />
        {submitError ? <AppText variant="caption" className="text-danger">{submitError}</AppText> : null}
        {warning ? <AppText variant="caption" className="text-danger">{warning}</AppText> : null}
        <AppButton
          title={submitting ? "Saving changes..." : "Save changes"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>
    </Screen>
  );
}
