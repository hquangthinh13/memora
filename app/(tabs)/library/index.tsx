import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { AddIcon } from "@hugeicons/core-free-icons";

import {
  AppCard,
  AppText,
  DeckCard,
  EmptyState,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { useDecks } from "@/hooks/useDecks";
import type { Deck, DeckCollaborator } from "@/services/decks";
import { listCollaborativeDecks } from "@/services/decks";

type CollabEntry = DeckCollaborator & { decks: Deck | null };

function useCollaborativeDecks() {
  const [entries, setEntries] = useState<CollabEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listCollaborativeDecks());
    } catch {
      // non-critical; silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { entries, loading };
}

export default function LibraryScreen() {
  const { decks, loading, error } = useDecks();
  const collab = useCollaborativeDecks();

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

      {/* Shared decks */}
      {!collab.loading && collab.entries.length > 0 ? (
        <View className="gap-3">
          <AppText variant="subtitle">Shared with me</AppText>
          {collab.entries.map((entry) => {
            const deck = entry.decks;
            if (!deck) return null;
            return (
              <AppCard
                key={entry.id}
                className="flex-row items-center gap-3"
              >
                <View className="size-12 items-center justify-center rounded-lg bg-lavender-soft">
                  <AppText variant="subtitle">
                    {deck.title.slice(0, 1).toUpperCase()}
                  </AppText>
                </View>
                <View className="flex-1 gap-0.5">
                  <AppText
                    variant="body"
                    className="font-sans-semibold"
                    numberOfLines={1}
                  >
                    {deck.title}
                  </AppText>
                  <AppText variant="caption" className="text-text-muted capitalize">
                    {entry.role}
                  </AppText>
                </View>
                <NavLink
                  href={`/decks/${deck.id}`}
                  title="Open"
                  variant="secondary"
                  className="h-9 min-h-9 rounded-full px-3"
                />
              </AppCard>
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
