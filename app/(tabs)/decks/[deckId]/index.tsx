import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";

import { AppButton, AppCard, AppText, EmptyState, NavLink, Screen, StaticFlashcard } from "@/components";
import { useDeckGeneration } from "@/hooks/useDeckGeneration";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { useQuestions } from "@/hooks/useQuestions";
import { getErrorMessage } from "@/lib/errors";
import { deleteDeckWithCoverImage } from "@/services/decks";

export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId, generate } = useLocalSearchParams<{ deckId: string; generate?: string }>();
  const { deck, loading, error, refresh } = useDeckDetail(deckId);
  const questions = useQuestions(deckId);
  const generation = useDeckGeneration(deckId);
  const generationStarted = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const coverUrl = deck?.cover_image_url ?? deck?.cover_url;
  const canEditCards = deck?.permission === "owner" || deck?.permission === "editor";
  const canManageDeck = deck?.permission === "owner";
  const isReady = deck?.status === "Ready";
  const isPreparing = deck?.status === "Preparing" || generation.generating;

  useEffect(() => {
    if (generate !== "1" || !deckId || generationStarted.current) return;

    generationStarted.current = true;
    generation.generate()
      .catch(() => null)
      .finally(() => {
        void refresh();
        void questions.refresh();
      });
  }, [deckId, generate, generation, questions, refresh]);

  async function handleDeleteDeck() {
    if (!deck) return;

    setDeleting(true);
    setDeleteWarning(null);
    setDeleteError(null);

    try {
      const result = await deleteDeckWithCoverImage(deck);
      if (result.coverDeleteWarning) {
        setDeleteWarning(result.coverDeleteWarning);
      }
      setDeleted(true);
      router.replace("/(tabs)/library");
    } catch (caught) {
      setDeleteError(getErrorMessage(caught, "Could not delete deck."));
    } finally {
      setDeleting(false);
    }
  }

  async function handleRetryGeneration() {
    try {
      await generation.generate();
    } finally {
      await refresh();
      await questions.refresh();
    }
  }

  if (deleted) {
    return <Redirect href="/(tabs)/library" />;
  }

  return (
    <Screen scroll contentClassName="pb-32">
      <View className="flex-row items-center justify-between">
        <AppButton title="Back" variant="ghost" className="min-h-10 px-4" onPress={() => router.back()} />
        <AppText variant="body" className="font-sans-semibold">
          Deck
        </AppText>
        <AppButton title="Menu" variant="ghost" className="min-h-10 px-4" disabled />
      </View>

      {loading ? <AppText variant="caption">Loading deck...</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
      {generation.error ? <AppText variant="caption" className="text-danger">{generation.error}</AppText> : null}
      {deleteError ? <AppText variant="caption" className="text-danger">{deleteError}</AppText> : null}
      {deleteWarning ? <AppText variant="caption" className="text-danger">{deleteWarning}</AppText> : null}

      {deck ? (
        <>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} className="h-56 w-full rounded-3xl bg-surface-soft" />
          ) : (
            <View className="h-56 w-full items-center justify-center rounded-3xl border border-border bg-pink-soft">
              <AppText variant="title">{deck.title.slice(0, 1).toUpperCase()}</AppText>
            </View>
          )}

          <View className="gap-2">
            <AppText variant="title">{deck.title}</AppText>
            <AppText variant="body" className="text-text-muted">
              {deck.description ?? "No description yet."}
            </AppText>
            <AppText variant="caption">
              {deck.topics?.name ?? "No topic"} - {deck.status}
            </AppText>
            <AppText variant="caption">
              {deck.card_count} cards - {questions.questions.length || deck.question_count} questions
            </AppText>
            {deck.generation_error ? (
              <AppText variant="caption" className="text-danger">
                {deck.generation_error}
              </AppText>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="min-w-[46%] flex-1">
              {isReady ? (
                <NavLink href={`/study?deckId=${deck.id}`} title="Review cards" variant="primary" />
              ) : (
                <AppButton title={isPreparing ? "Preparing..." : "Review cards"} disabled />
              )}
            </View>
            <View className="min-w-[46%] flex-1">
              {isReady && questions.questions.length > 0 ? (
                <NavLink href={`/quiz?deckId=${deck.id}`} title="Start quiz" />
              ) : (
                <AppButton title="Start quiz" variant="secondary" disabled />
              )}
            </View>
            {deck.status === "Failed" ? (
              <View className="min-w-[46%] flex-1">
                <AppButton
                  title={generation.generating ? "Retrying..." : "Retry generation"}
                  variant="secondary"
                  disabled={generation.generating}
                  onPress={() => void handleRetryGeneration()}
                />
              </View>
            ) : null}
            {canEditCards ? (
              <View className="min-w-[46%] flex-1">
                <NavLink href={`/cards/edit?deckId=${deck.id}`} title="Add card" />
              </View>
            ) : null}
            {canManageDeck ? (
              <>
                <View className="min-w-[46%] flex-1">
                  <AppButton title="Invite friends" variant="secondary" disabled />
                </View>
                <View className="min-w-[46%] flex-1">
                  <NavLink href={`/decks/${deck.id}/edit`} title="Edit deck" />
                </View>
                <View className="min-w-[46%] flex-1">
                  <AppButton
                    title={deleting ? "Deleting..." : "Delete deck"}
                    variant="ghost"
                    disabled={deleting}
                    onPress={handleDeleteDeck}
                  />
                </View>
              </>
            ) : null}
          </View>

          <View className="gap-3">
            <AppText variant="subtitle">Cards</AppText>
            {isPreparing ? (
              <EmptyState title="Preparing content" description="AI is creating cards and questions for this deck." />
            ) : null}
            {deck.cards.length ? (
              deck.cards.map((card) => (
                <StaticFlashcard
                  key={card.id}
                  front={card.front ?? "Untitled card"}
                  back={card.back ?? "No definition yet."}
                  explanation={card.explanation}
                  tags={card.tags}
                />
              ))
            ) : !isPreparing ? (
              <EmptyState title="No cards yet" description="Add the first card for this deck." />
            ) : null}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
