import { Image, Pressable, View } from "react-native";
import { Link } from "expo-router";

import {
  AppButton,
  AppText,
  DeckCard,
  EmptyState,
  NavLink,
  ProgressSummaryCard,
  Screen,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDecks } from "@/hooks/useDecks";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { signOut } from "@/services/auth";
import { Logout01Icon } from "@hugeicons/core-free-icons";

export default function HomeScreen() {
  const { profile } = useAuth();
  const progress = useLearningProgress();
  const { decks, loading, error } = useDecks();
  const firstDeck = decks[0];
  const displayName = profile?.display_name ?? "Learner";
  const recentDecks = decks.slice(0, 3);

  return (
    <Screen scroll contentClassName="">
      <View className="flex-row items-center justify-between">
        <Link href="/profile" asChild>
          <Pressable className="flex-row items-center gap-3 active:opacity-80">
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="size-12 rounded-full bg-surface-soft"
              />
            ) : (
              <View className="size-12 items-center justify-center rounded-full bg-mint">
                <AppText variant="subtitle">
                  {displayName.slice(0, 1).toUpperCase()}
                </AppText>
              </View>
            )}
            <View>
              <AppText variant="caption">Welcome back</AppText>
              <AppText variant="body" className="font-sans-semibold">
                {displayName}
              </AppText>
            </View>
          </Pressable>
        </Link>

        <AppButton
          title="Log out"
          variant="destructive"
          icon={Logout01Icon}
          layout="icon-only"
          onPress={async () => {
            try {
              // console.log("Logging out...");
              await signOut();
              // console.log("Logged out");
            } catch (error) {
              console.error("Logout failed:", error);
            }
          }}
        />
      </View>

      <AppText variant="title" className="text-4xl">
        What would you like to remember today?
      </AppText>

      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}

      <ProgressSummaryCard
        studiedCount={progress.studiedCount}
        streakLabel="0"
        accuracyLabel="0%"
      />

      <View className="flex-row gap-2">
        <View className="flex-1">
          <NavLink
            href={
              firstDeck?.status === "Ready"
                ? `/study?deckId=${firstDeck.id}`
                : "/library"
            }
            title="Continue"
            variant="primary"
          />
        </View>
        <View className="flex-1">
          <NavLink href="/decks/new" title="Create a deck" />
        </View>
        {/* <View className="flex-1">
          <NavLink href="/study" title="Study" />
        </View> */}
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
            <DeckCard
              key={deck.id}
              deck={deck}
              href={`/decks/${deck.id}`}
              compact={false}
            />
          ))
        ) : (
          <EmptyState
            title="No decks yet"
            description="Create a deck and it will appear here."
            className="bg-surface-soft"
          />
        )}
      </View>
    </Screen>
  );
}
