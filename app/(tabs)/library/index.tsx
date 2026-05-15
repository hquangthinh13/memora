import { AppText, DeckCard, EmptyState, NavLink, Screen } from "@/components";
import { useDecks } from "@/hooks/useDecks";

export default function LibraryScreen() {
  const { decks, loading, error } = useDecks();

  return (
    <Screen scroll contentClassName="pb-32">
      <AppText variant="title">My Library</AppText>
      <AppText variant="body" className="text-text-muted">
        Your owned, shared, public, and collaborative decks live here.
      </AppText>

      <NavLink href="/decks/new" title="Create deck" variant="primary" />

      {loading ? <AppText variant="caption">Loading decks...</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

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
