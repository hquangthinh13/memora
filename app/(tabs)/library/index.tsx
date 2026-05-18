import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { AddIcon } from "@hugeicons/core-free-icons";

import {
  AppText,
  DeckCard,
  EmptyState,
  LoadingState,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { useDecks } from "@/hooks/useDecks";
import type { DeckCollaborator, DeckSummary } from "@/services/decks";
import { listCollaborativeDecks } from "@/services/decks";

type CollabEntry = DeckCollaborator & { decks: DeckSummary | null };

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
        <LoadingState label="Loading decks..." />
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
          description="Create your first deck to start building your library."
          showIllustration
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
              <DeckCard key={entry.id} deck={deck} href={`/decks/${deck.id}`} />
            );
          })}
        </View>
      ) : null}
    </Screen>
  );
}
