import { useLocalSearchParams } from "expo-router";

import { AppCard, AppText, NavLink, PlaceholderList, Screen } from "@/components";
import { useDeckDetail } from "@/hooks/useDeckDetail";

export default function DeckDetailScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const { deck, loading, error } = useDeckDetail(deckId);

  return (
    <Screen scroll>
      <AppCard className="bg-pink">
        <AppText variant="title">{deck?.title ?? "Deck"}</AppText>
        <AppText variant="body" className="mt-3 text-text-muted">
          {deck?.description ?? "Review cards, edit deck settings, or add new material."}
        </AppText>
      </AppCard>

      {loading ? <AppText variant="caption">Loading deck...</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      {deck ? (
        <>
          <NavLink href={`/study?deckId=${deck.id}`} title="Study this deck" variant="primary" />
          <NavLink href={`/decks/${deck.id}/edit`} title="Edit deck" />
          <NavLink href={`/cards/edit?deckId=${deck.id}`} title="Create card" />
          <PlaceholderList
            items={
              deck.cards.length
                ? deck.cards.map((card) => ({
                    title: card.term ?? "Untitled card",
                    description: card.definition ?? "No definition yet.",
                    tone: "bg-surface",
                  }))
                : [
                    {
                      title: "No cards yet",
                      description: "Create the first card for this deck.",
                      tone: "bg-surface",
                    },
                  ]
            }
          />
        </>
      ) : null}
    </Screen>
  );
}
