import { Image, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";

import {
  AppText,
  DeckCard,
  EmptyState,
  LearningDashboard,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDecks } from "@/hooks/useDecks";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { AddIcon, PlayIcon } from "@hugeicons/core-free-icons";
export default function HomeScreen() {
  const { profile } = useAuth();
  const progress = useLearningProgress();
  const { decks, loading, error } = useDecks();
  const firstDeck = decks[0];
  const displayName = profile?.display_name ?? "Learner";
  const recentDecks = decks.slice(0, 3);

  return (
    <Screen
      header={
        <SectionHeader
          title={`Hello, ${displayName}`}
          description="What would you like to remember today?"
        >
          <Link href="/profile" asChild>
            <TouchableOpacity className="flex-row items-center gap-2 active:opacity-80">
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="size-10 rounded-full bg-surface-soft"
                />
              ) : (
                <View className="size-10 items-center justify-center rounded-full bg-mint">
                  <AppText variant="caption" className="font-sans-semibold">
                    {displayName.slice(0, 1).toUpperCase()}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          </Link>
        </SectionHeader>
      }
      scroll
    >
      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}

      <LearningDashboard
        stats={progress.stats}
        weeklyActivity={progress.weeklyActivity}
        todayCards={progress.todayCards}
        accuracy={progress.accuracy}
        loading={progress.loading}
      />

      <View className="flex-row gap-2">
        <View className="flex-1">
          <NavLink
            href={
              firstDeck?.status === "Ready"
                ? `/study?deckId=${firstDeck.id}`
                : "/library"
            }
            layout="icon-leading"
            icon={PlayIcon}
            title="Continue"
            variant="primary"
          />
        </View>
        <View className="flex-1">
          <NavLink
            href="/decks/new"
            title="Create a deck"
            layout="icon-leading"
            icon={AddIcon}
          />
        </View>
      </View>

      <View className="gap-4">
        <View>
          <AppText variant="subtitle">Recent decks</AppText>
          <AppText variant="caption">
            {loading
              ? "Loading your library..."
              : "Pick up where you left off."}
          </AppText>
        </View>
        {recentDecks.length ? (
          recentDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} href={`/decks/${deck.id}`} />
          ))
        ) : (
          <EmptyState
            title="No decks yet"
            description="Create a deck and it will appear here."
            className="bg-surface-soft"
            showIllustration
          />
        )}
      </View>
    </Screen>
  );
}
