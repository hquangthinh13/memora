import {
  AppText,
  DeckCard,
  EmptyState,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { useDecks } from "@/hooks/useDecks";
import { AddIcon } from "@hugeicons/core-free-icons";

export default function LibraryScreen() {
  const { decks, loading, error } = useDecks();

  return (
    <Screen
      header={
        <SectionHeader
          title="My Library"
          description="Your AI-generated decks, cards, and quiz questions live here."
        >
          <NavLink
            layout="icon-leading"
            icon={AddIcon}
            href="/decks/new"
            title="New deck"
            variant="ghost"
          />
        </SectionHeader>
      }
      scroll
    >
      {loading ? (
        <AppText variant="caption" className="text-center">
          Loading decks...
        </AppText>
      ) : null}
      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}

      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} href={`/decks/${deck.id}`} />
      ))}

      {!loading && decks.length === 0 ? (
        <EmptyState
          title="No decks yet"
          description="Create your first deck or save a public deck to start building your library."
        />
      ) : null}
    </Screen>
  );
}
