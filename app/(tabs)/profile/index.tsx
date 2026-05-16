import { Image, View } from "react-native";

import { AppButton, AppCard, AppText, EmptyState, NavLink, Screen, UserItem } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useProfileOverview } from "@/hooks/useProfileOverview";
import { signOut } from "@/services/auth";

export default function ProfileScreen() {
  const { profile } = useAuth();
  const overview = useProfileOverview();
  const displayName = profile?.display_name ?? "Learner";

  return (
    <Screen scroll contentClassName="pb-32">
      <View className="items-center gap-3">
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} className="size-24 rounded-full bg-surface-soft" />
        ) : (
          <View className="size-24 items-center justify-center rounded-full bg-lavender">
            <AppText variant="title">{displayName.slice(0, 1).toUpperCase()}</AppText>
          </View>
        )}
        <View className="items-center">
          <AppText variant="title">{displayName}</AppText>
          <AppText variant="caption">{profile?.email}</AppText>
        </View>
        <NavLink href="/profile/edit" title="Edit profile" variant="secondary" />
      </View>

      {overview.error ? <AppText variant="caption" className="text-danger">{overview.error}</AppText> : null}

      <AppCard className="gap-3 bg-surface-soft">
        <AppText variant="subtitle">My topics</AppText>
        <AppText variant="caption">
          Create and organize the subjects used for AI deck generation.
        </AppText>
        <NavLink href="/topics" title="Manage topics" variant="primary" />
      </AppCard>

      <View className="flex-row gap-3">
        <AppCard className="flex-1 items-center bg-mint-soft">
          <AppText variant="title" className="text-2xl">
            {overview.friendCount}
          </AppText>
          <AppText variant="caption">Friends</AppText>
        </AppCard>
        <AppCard className="flex-1 items-center bg-peach-soft">
          <AppText variant="title" className="text-2xl">
            {overview.publishedDecks.length}
          </AppText>
          <AppText variant="caption">Published</AppText>
        </AppCard>
      </View>

      <View className="gap-3">
        <AppText variant="subtitle">Friends</AppText>
        {overview.friendCount ? (
          <UserItem name="Friend list" subtitle={`${overview.friendCount} accepted friends`} />
        ) : (
          <EmptyState title="No friends yet" description="Friend discovery and invites will be added next." />
        )}
      </View>

      <View className="gap-3">
        <AppText variant="subtitle">Published decks</AppText>
        {overview.publishedDecks.length ? (
          overview.publishedDecks.map((deck) => (
            <AppCard key={deck.id} className="gap-1">
              <AppText variant="body" className="font-sans-semibold">
                {deck.title}
              </AppText>
              <AppText variant="caption">{deck.card_count} cards</AppText>
            </AppCard>
          ))
        ) : (
          <EmptyState title="No published decks" description="Public decks you own will appear here." />
        )}
      </View>

      <View className="gap-3">
        <AppText variant="subtitle">Saved decks</AppText>
        {overview.savedDecks.length ? (
          <AppText variant="caption">{overview.savedDecks.length} saved decks</AppText>
        ) : (
          <EmptyState title="No saved decks" description="Saved public decks will appear here." />
        )}
      </View>

      <View className="gap-3">
        <AppText variant="subtitle">Collaborative decks</AppText>
        {overview.collaborativeDecks.length ? (
          <AppText variant="caption">{overview.collaborativeDecks.length} collaborative decks</AppText>
        ) : (
          <EmptyState title="No collaborations" description="Decks shared with editor or viewer access will appear here." />
        )}
      </View>

      <AppButton title="Log out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
