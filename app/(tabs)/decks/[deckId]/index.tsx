import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Image, View } from "react-native";

import { AppButton, AppCard, AppText, EmptyState, NavLink, Screen, StaticFlashcard } from "@/components";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { getErrorMessage } from "@/lib/errors";
import { deleteDeckWithCoverImage } from "@/services/decks";
import { useState } from "react";

export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { deck, loading, error } = useDeckDetail(deckId);
  const [deleting, setDeleting] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const coverUrl = deck?.cover_image_url ?? deck?.cover_url;
  const canEditCards = deck?.permission === "owner" || deck?.permission === "editor";
  const canManageDeck = deck?.permission === "owner";

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
              {deck.card_count} cards - {deck.collaborator_count} collaborators
            </AppText>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <View className="min-w-[46%] flex-1">
              <NavLink href={`/study?deckId=${deck.id}`} title="Start learning" variant="primary" />
            </View>
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
            {deck.cards.length ? (
              deck.cards.map((card) => (
                <StaticFlashcard
                  key={card.id}
                  front={card.term ?? "Untitled card"}
                  back={card.definition ?? "No definition yet."}
                  hint={card.hint}
                />
              ))
            ) : (
              <EmptyState title="No cards yet" description="Add the first card for this deck." />
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
