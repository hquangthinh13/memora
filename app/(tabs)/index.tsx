import { AppButton, AppCard, AppText, NavLink, PlaceholderList, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDecks } from "@/hooks/useDecks";
import { signOut } from "@/services/auth";

export default function HomeScreen() {
  const { profile } = useAuth();
  const { decks, loading, error } = useDecks();
  const firstDeck = decks[0];

  return (
    <Screen scroll contentClassName="pb-32">
      <AppCard className="bg-peach">
        <AppText variant="title">
          {profile?.display_name ? `Hi, ${profile.display_name}` : "Today's practice"}
        </AppText>
        <AppText variant="body" className="mt-3 text-text-muted">
          {loading
            ? "Loading your learning space..."
            : `You have ${decks.length} readable deck${decks.length === 1 ? "" : "s"} ready.`}
        </AppText>
      </AppCard>

      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      {firstDeck ? (
        <>
          <NavLink href={`/study?deckId=${firstDeck.id}`} title="Start study session" variant="primary" />
          <NavLink href={`/rooms/lobby?deckId=${firstDeck.id}`} title="Open room lobby" />
        </>
      ) : (
        <NavLink href="/decks/new" title="Create your first deck" variant="primary" />
      )}

      <PlaceholderList
        items={[
          {
            title: "Study progress",
            description: "Due-card scheduling will update as you review cards.",
            tone: "bg-mint",
          },
          {
            title: "Recent deck",
            description: firstDeck
              ? `${firstDeck.title} was updated ${new Date(firstDeck.updated_at).toLocaleDateString()}.`
              : "Create a deck to see recent activity here.",
            tone: "bg-lavender",
          },
        ]}
      />

      <AppButton title="Log out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
