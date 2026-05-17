import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Clock01Icon,
  Edit01Icon,
  Logout01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";

import {
  AppButton,
  AppText,
  DeckCard,
  EmptyState,
  LoadingState,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { FriendPreviewCard } from "@/components";
import { ProfileHeader } from "@/components";
import { ProfileSectionHeader } from "@/components";
import { CreateTopicSheet } from "@/components";
import { TopicCard } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDecks } from "@/hooks/useDecks";
import { usePaginatedTopics } from "@/hooks/usePaginatedTopics";
import { useProfileFriends } from "@/hooks/useProfileFriends";
import { useStudyReminder } from "@/hooks/useStudyReminder";
import { signOut } from "@/services/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [createTopicOpen, setCreateTopicOpen] = useState(false);

  const topics = usePaginatedTopics();
  const friends = useProfileFriends();
  const { decks } = useDecks();
  const reminders = useStudyReminder();

  const displayName = profile?.display_name ?? "Learner";

  const combinedError = useMemo(() => {
    return topics.error ?? friends.error ?? null;
  }, [friends.error, topics.error]);

  return (
    <Screen
      scroll
      header={
        <SectionHeader title="Profile" backHref="/profile">
          <NavLink
            href="/profile/edit"
            layout="icon-only"
            icon={Edit01Icon}
            variant="outline"
          />
        </SectionHeader>
      }
    >
      {combinedError ? (
        <AppText variant="caption" className="text-danger">
          {combinedError}
        </AppText>
      ) : null}

      <ProfileHeader
        avatarUrl={profile?.avatar_url}
        displayName={displayName}
        email={profile?.email}
        friendCount={friends.friendCount}
        deckCount={decks.length}
        topicCount={topics.topicCount}
      />

      <View className="gap-3">
        <ProfileSectionHeader
          title="Topics"
          actionTitle="Create"
          onPressAction={() => setCreateTopicOpen(true)}
        />

        {topics.loadingInitial ? (
          <LoadingState label="Loading topics..." center={false} />
        ) : topics.items.length === 0 ? (
          <EmptyState
            title="No topics yet"
            description="Create a topic to organize your decks."
            showIllustration
          />
        ) : (
          <FlatList
            data={topics.items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TopicCard topic={item} />}
            onEndReachedThreshold={0.6}
            onEndReached={() => {
              void topics.loadMore();
            }}
            ListFooterComponent={
              topics.loadingMore ? (
                <View className="justify-center pr-3">
                  <LoadingState size="sm" />
                </View>
              ) : null
            }
          />
        )}
      </View>

      <View className="gap-3">
        <ProfileSectionHeader
          title="Friends"
          actionTitle="See all"
          onPressAction={() => router.push("/friends")}
        />

        {friends.loading ? (
          <LoadingState label="Loading friends..." center={false} />
        ) : friends.friends.length === 0 ? (
          <EmptyState
            title="No friends yet"
            description="Add friends from the Friends tab to see them here."
            showIllustration
          />
        ) : (
          <FlatList
            data={friends.friends}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <FriendPreviewCard friend={item} />}
          />
        )}
      </View>

      <View className="gap-3">
        <ProfileSectionHeader
          title="My decks"
          actionTitle="See all"
          onPressAction={() => router.push("/library")}
        />

        {decks.length === 0 ? (
          <EmptyState
            title="No decks yet"
            description="Create your first deck from the Library tab."
            showIllustration
          />
        ) : (
          <View className="gap-3">
            {decks.slice(0, 5).map((deck) => (
              <DeckCard key={deck.id} deck={deck} href={`/decks/${deck.id}`} />
            ))}
          </View>
        )}
      </View>

      <View className="gap-3">
        <ProfileSectionHeader title="Study reminders" />

        <View className="rounded-lg border border-border bg-surface p-4 gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <AppText variant="body" className="font-sans-semibold">
                Daily study reminder
              </AppText>
              <AppText variant="caption" className="text-text-muted">
                {reminders.settings?.study_reminder_enabled
                  ? `Daily at ${reminders.currentTimeLabel}`
                  : "Off"}
              </AppText>
            </View>
            <AppButton
              title={reminders.settings?.study_reminder_enabled ? "On" : "Off"}
              variant={
                reminders.settings?.study_reminder_enabled
                  ? "primary"
                  : "secondary"
              }
              icon={Notification03Icon}
              layout="icon-leading"
              disabled={
                reminders.loading || reminders.saving || !reminders.settings
              }
              onPress={() => {
                if (!reminders.settings) return;
                void reminders.toggleEnabled(
                  !reminders.settings.study_reminder_enabled,
                );
              }}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <AppText variant="caption" className="text-text-muted">
              Permission: {reminders.permissionStatus}
            </AppText>
            {reminders.permissionStatus !== "granted" ? (
              <AppButton
                title="Request permission"
                variant="ghost"
                className="min-h-9 px-0"
                disabled={reminders.saving}
                onPress={() => {
                  void reminders.requestPermission();
                }}
              />
            ) : null}
          </View>

          <View className="gap-2">
            <AppText variant="caption" className="text-text-muted">
              Time presets
            </AppText>
            <View className="flex-row gap-2">
              <AppButton
                title="Morning"
                variant="secondary"
                icon={Clock01Icon}
                layout="icon-leading"
                className="flex-1"
                disabled={reminders.saving || !reminders.settings}
                onPress={() => {
                  void reminders.setPreset("morning");
                }}
              />
              <AppButton
                title="Afternoon"
                variant="secondary"
                icon={Clock01Icon}
                layout="icon-leading"
                className="flex-1"
                disabled={reminders.saving || !reminders.settings}
                onPress={() => {
                  void reminders.setPreset("afternoon");
                }}
              />
              <AppButton
                title="Evening"
                variant="secondary"
                icon={Clock01Icon}
                layout="icon-leading"
                className="flex-1"
                disabled={reminders.saving || !reminders.settings}
                onPress={() => {
                  void reminders.setPreset("evening");
                }}
              />
            </View>
          </View>

          {reminders.error ? (
            <AppText variant="caption" className="text-danger">
              {reminders.error}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* <View className="gap-2">
        <AppText variant="subtitle">Account</AppText> */}
      <AppButton
        title="Log out"
        icon={Logout01Icon}
        layout="icon-leading"
        variant="destructive"
        className="justify-start rounded-lg bg-surface px-4"
        onPress={signOut}
      />
      {/* </View> */}

      <CreateTopicSheet
        visible={createTopicOpen}
        onClose={() => setCreateTopicOpen(false)}
        onCreate={async ({ name, description }) => {
          await topics.createAndPrepend({ name, description });
        }}
      />
    </Screen>
  );
}
