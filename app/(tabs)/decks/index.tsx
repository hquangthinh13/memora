import { AppCard, AppText, NavLink, PlaceholderList, Screen } from "@/components";
import { useDecks } from "@/hooks/useDecks";

export default function DeckListScreen() {
  const { decks, loading, error } = useDecks();

  return (
    <Screen scroll contentClassName="pb-32">
      <AppText variant="title">Decks</AppText>
      <AppText variant="body" className="text-text-muted">
        Browse decks you own, decks shared with you, and public/link decks.
      </AppText>

      <NavLink href="/decks/new" title="Create deck" variant="primary" />

      {loading ? <AppText variant="caption">Loading decks...</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      {decks.map((deck, index) => (
        <AppCard
          key={deck.id}
          className={index % 2 === 0 ? "gap-3 bg-pink" : "gap-3 bg-mint"}
        >
          <AppText variant="subtitle">{deck.title}</AppText>
          <AppText variant="caption">
            {deck.visibility.toLowerCase()} {deck.language ? `- ${deck.language}` : ""}
          </AppText>
          <NavLink href={`/decks/${deck.id}`} title="Open deck" />
        </AppCard>
      ))}

      {!loading && decks.length === 0 ? (
        <PlaceholderList
          items={[
            {
              title: "No decks yet",
              description: "Create your first deck to start adding flashcards.",
              tone: "bg-peach",
            },
          ]}
        />
      ) : null}
    </Screen>
  );
}
