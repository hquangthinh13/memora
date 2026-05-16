import { Image, View } from "react-native";
import {
  BookOpen01Icon,
  Edit01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";

import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  NavLink,
  Screen,
  SectionHeader,
  UserItem,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useProfileOverview } from "@/hooks/useProfileOverview";
import { signOut } from "@/services/auth";

export default function ProfileScreen() {
  const { profile } = useAuth();
  const overview = useProfileOverview();
  const displayName = profile?.display_name ?? "Learner";

  return (
    <Screen
      scroll
      contentClassName="pb-32"
      header={
        <SectionHeader title="Profile">
          <NavLink
            href="/profile/edit"
            layout="icon-only"
            icon={Edit01Icon}
            variant="outline"
          />
        </SectionHeader>
      }
    >
      {overview.error ? (
        <AppText variant="caption" className="text-danger">
          {overview.error}
        </AppText>
      ) : null}

      {/* ── Avatar + name ── */}
      <View className="items-center gap-3 py-2">
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            className="size-24 rounded-full bg-surface-soft"
          />
        ) : (
          <View className="size-24 items-center justify-center rounded-full bg-lavender">
            <AppText variant="title" className="text-3xl">
              {displayName.slice(0, 1).toUpperCase()}
            </AppText>
          </View>
        )}

        <View className="items-center gap-1">
          <AppText variant="title">{displayName}</AppText>
          <AppText variant="caption">{profile?.email}</AppText>
        </View>
      </View>

      {/* ── Stats ── */}
      <View className="flex-row gap-3">
        <AppCard className="flex-1 items-center gap-1 bg-mint-soft">
          <AppText variant="title" className="text-2xl">
            {overview.friendCount}
          </AppText>
          <AppText variant="caption">Friends</AppText>
        </AppCard>

        <AppCard className="flex-1 items-center gap-1 bg-peach-soft">
          <AppText variant="title" className="text-2xl">
            {overview.publishedDecks.length}
          </AppText>
          <AppText variant="caption">Published</AppText>
        </AppCard>

        <AppCard className="flex-1 items-center gap-1 bg-lavender-soft">
          <AppText variant="title" className="text-2xl">
            {overview.savedDecks.length}
          </AppText>
          <AppText variant="caption">Saved</AppText>
        </AppCard>
      </View>

      {/* ── Library ── */}
      <View className="gap-2">
        <AppText variant="subtitle">Library</AppText>
        <NavLink
          href="/topics"
          title="My topics"
          icon={BookOpen01Icon}
          layout="icon-leading"
          variant="ghost"
          className="justify-start rounded-2xl bg-surface px-4"
        />
      </View>

      {/* ── Friends ── */}
      <View className="gap-3">
        <AppText variant="subtitle">Friends</AppText>
        {overview.friendCount ? (
          <UserItem
            name="Friend list"
            subtitle={`${overview.friendCount} accepted friends`}
          />
        ) : (
          <EmptyState
            title="No friends yet"
            description="Friend discovery and invites will be added next."
          />
        )}
      </View>

      {/* ── Published decks ── */}
      <View className="gap-3">
        <AppText variant="subtitle">Published decks</AppText>
        {overview.publishedDecks.length ? (
          overview.publishedDecks.map((deck) => (
            <AppCard key={deck.id} className="flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-lg bg-peach-soft">
                <AppText variant="subtitle">
                  {deck.title.slice(0, 1).toUpperCase()}
                </AppText>
              </View>
              <View className="flex-1">
                <AppText
                  variant="body"
                  className="font-sans-semibold"
                  numberOfLines={1}
                >
                  {deck.title}
                </AppText>
                <AppText variant="caption">{deck.card_count} cards</AppText>
              </View>
            </AppCard>
          ))
        ) : (
          <EmptyState
            title="No published decks"
            description="Public decks you own will appear here."
          />
        )}
      </View>

      {/* ── Account ── */}
      <View className="gap-2">
        <AppText variant="subtitle">Account</AppText>
        <AppButton
          title="Log out"
          icon={Logout01Icon}
          layout="icon-leading"
          variant="destructive"
          className="justify-start rounded-2xl bg-surface px-4"
          onPress={signOut}
        />
      </View>
    </Screen>
  );
}
