import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Delete01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ConfirmDialog,
  EmptyState,
  Screen,
  SectionHeader,
  UserItem,
} from "@/components";
import { colors } from "@/constants/theme";
import { useFriendSharedLibrary } from "@/hooks/useFriendSharedLibrary";
import { useFriendSearch, useFriends } from "@/hooks/useFriends";

export default function FriendsScreen() {
  const router = useRouter();
  const friends = useFriends();
  const sharedLibrary = useFriendSharedLibrary();
  const { query, results, loading: searching, search } = useFriendSearch();

  const [activeTab, setActiveTab] = useState<"friend-list" | "shared-library">(
    "friend-list",
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isSearching = query.trim().length >= 2;

  async function handleAction(id: string, fn: () => Promise<void>) {
    setActionLoading(id);
    try {
      await fn();
      await sharedLibrary.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  const friendIds = new Set(friends.friends.map((f) => f.friend.id));
  const outgoingIds = new Set(friends.outgoing.map((f) => f.friend.id));

  return (
    <Screen
      header={
        <SectionHeader
          title="Friends"
          description="Manage your social connections and browse friends' published decks."
        />
      }
      scroll
      contentClassName="pb-32"
    >
      <View className="flex-row gap-2 rounded-lg border border-border bg-surface-soft p-1">
        <AppButton
          title="Friend list"
          variant={activeTab === "friend-list" ? "primary" : "ghost"}
          className="flex-1"
          onPress={() => setActiveTab("friend-list")}
        />
        <AppButton
          title="Shared library"
          variant={activeTab === "shared-library" ? "primary" : "ghost"}
          className="flex-1"
          onPress={() => setActiveTab("shared-library")}
        />
      </View>

      {activeTab === "friend-list" ? (
        <>
          <AppInput
            placeholder="Search by name or email..."
            value={query}
            onChangeText={search}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {isSearching ? (
            <View className="gap-3">
              <AppText variant="subtitle">Search results</AppText>
              {searching ? (
                <AppText
                  variant="caption"
                  className="text-center text-text-muted"
                >
                  Searching...
                </AppText>
              ) : results.length === 0 ? (
                <EmptyState
                  title="No users found"
                  description="Try a different name or email."
                  showIllustration
                />
              ) : (
                results.map((user) => {
                  const isFriend = friendIds.has(user.id);
                  const sentRequest = outgoingIds.has(user.id);
                  const thisLoading = actionLoading === user.id;
                  return (
                    <UserItem
                      key={user.id}
                      name={user.display_name ?? user.email ?? "Unknown"}
                      subtitle={user.email ?? undefined}
                      avatarUrl={user.avatar_url}
                      action={
                        isFriend ? (
                          <View className="rounded-full bg-mint-soft px-3 py-1">
                            <AppText variant="caption" className="text-text">
                              Friends
                            </AppText>
                          </View>
                        ) : sentRequest ? (
                          <View className="rounded-full bg-surface-soft px-3 py-1">
                            <AppText
                              variant="caption"
                              className="text-text-muted"
                            >
                              Sent
                            </AppText>
                          </View>
                        ) : (
                          <AppButton
                            title={thisLoading ? "..." : "Add"}
                            variant="secondary"
                            icon={UserAdd01Icon}
                            layout="icon-leading"
                            className="h-9 min-h-9 rounded-full px-3"
                            disabled={thisLoading}
                            onPress={() =>
                              handleAction(user.id, () =>
                                friends.sendFriendRequest(user.id),
                              )
                            }
                          />
                        )
                      }
                    />
                  );
                })
              )}
            </View>
          ) : (
            <>
              {friends.incoming.length > 0 ? (
                <View className="gap-3">
                  <AppText variant="subtitle">
                    Requests ({friends.incoming.length})
                  </AppText>
                  {friends.incoming.map((req) => {
                    const thisLoading = actionLoading === req.id;
                    return (
                      <UserItem
                        key={req.id}
                        name={
                          req.friend.display_name ??
                          req.friend.email ??
                          "Unknown"
                        }
                        subtitle={req.friend.email ?? undefined}
                        avatarUrl={req.friend.avatar_url}
                        action={
                          <View className="flex-row gap-2">
                            <AppButton
                              layout="icon-only"
                              icon={CheckmarkCircle01Icon}
                              variant="secondary"
                              className="h-10 w-10 min-h-10 rounded-full"
                              iconColor={colors.mint}
                              disabled={thisLoading}
                              onPress={() =>
                                handleAction(req.id, () =>
                                  friends.acceptFriendRequest(req.id),
                                )
                              }
                            />
                            <AppButton
                              layout="icon-only"
                              icon={Cancel01Icon}
                              variant="ghost"
                              className="h-10 w-10 min-h-10 rounded-full"
                              disabled={thisLoading}
                              onPress={() =>
                                handleAction(req.id, () =>
                                  friends.rejectFriendRequest(req.id),
                                )
                              }
                            />
                          </View>
                        }
                      />
                    );
                  })}
                </View>
              ) : null}

              <View className="gap-3">
                <AppText variant="subtitle">Your friends</AppText>
                {friends.loading ? (
                  <AppText
                    variant="caption"
                    className="text-center text-text-muted"
                  >
                    Loading...
                  </AppText>
                ) : friends.friends.length === 0 ? (
                  <EmptyState
                    title="No friends yet"
                    description="Search for someone above to send a friend request."
                    showIllustration
                  />
                ) : (
                  friends.friends.map((f) => {
                    const thisLoading = actionLoading === f.id;
                    return (
                      <View key={f.id} className="gap-2">
                        <UserItem
                          name={
                            f.friend.display_name ?? f.friend.email ?? "Friend"
                          }
                          subtitle={f.friend.email ?? undefined}
                          avatarUrl={f.friend.avatar_url}
                          action={
                            <AppButton
                              layout="icon-only"
                              icon={Delete01Icon}
                              variant="ghost"
                              className="h-10 w-10 min-h-10 rounded-full"
                              disabled={thisLoading}
                              onPress={() =>
                                setPendingRemove({
                                  id: f.id,
                                  name:
                                    f.friend.display_name ??
                                    f.friend.email ??
                                    "this friend",
                                })
                              }
                            />
                          }
                        />
                        {/* <View className="ml-15 flex-row gap-3 rounded-lg bg-surface-soft px-3 py-2">
                          <AppText
                            variant="caption"
                            className="text-text-muted"
                          >
                            Streak: {f.progress?.current_streak ?? 0}
                          </AppText>
                          <AppText
                            variant="caption"
                            className="text-text-muted"
                          >
                            Cards: {f.progress?.total_cards_studied ?? 0}
                          </AppText>
                          <AppText
                            variant="caption"
                            className="text-text-muted"
                          >
                            Quizzes: {f.progress?.total_quizzes_completed ?? 0}
                          </AppText>
                        </View> */}
                      </View>
                    );
                  })
                )}
              </View>

              {friends.outgoing.length > 0 ? (
                <View className="gap-3">
                  <AppText variant="subtitle">Sent requests</AppText>
                  {friends.outgoing.map((req) => {
                    const thisLoading = actionLoading === req.id;
                    return (
                      <UserItem
                        key={req.id}
                        name={
                          req.friend.display_name ??
                          req.friend.email ??
                          "Unknown"
                        }
                        subtitle="Pending..."
                        avatarUrl={req.friend.avatar_url}
                        action={
                          <AppButton
                            title={thisLoading ? "..." : "Cancel"}
                            variant="ghost"
                            icon={Cancel01Icon}
                            layout="icon-only"
                            className="h-9 min-h-9 rounded-full px-3"
                            disabled={thisLoading}
                            onPress={() =>
                              handleAction(req.id, () =>
                                friends.cancelFriendRequest(req.id),
                              )
                            }
                          />
                        }
                      />
                    );
                  })}
                </View>
              ) : null}
            </>
          )}
        </>
      ) : (
        <View className="gap-4">
          {sharedLibrary.loading ? (
            <AppText variant="caption" className="text-center text-text-muted">
              Loading shared library...
            </AppText>
          ) : sharedLibrary.error ? (
            <AppText variant="caption" className="text-danger">
              {sharedLibrary.error}
            </AppText>
          ) : sharedLibrary.groups.length === 0 ? (
            <EmptyState
              title="No friends yet"
              description="Add friends to browse their published decks."
              showIllustration
            />
          ) : (
            sharedLibrary.groups.map((group) => (
              <View
                key={group.friend.id}
                className="gap-2 rounded-lg border border-border bg-surface p-3"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <AppText variant="body" className="font-sans-semibold">
                      {group.friend.display_name ??
                        group.friend.email ??
                        "Friend"}
                    </AppText>
                    <AppText variant="caption" className="text-text-muted">
                      {group.friend.email ?? ""}
                    </AppText>
                  </View>
                  <AppText variant="caption" className="text-text-muted">
                    {group.decks.length} published
                  </AppText>
                </View>

                {group.decks.length === 0 ? (
                  <EmptyState
                    title="No published decks"
                    description="This friend has no public ready decks yet."
                    className="bg-surface-soft"
                  />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-3 pr-2">
                      {group.decks.map((deck) => (
                        <TouchableOpacity
                          key={deck.id}
                          activeOpacity={0.8}
                          onPress={() => router.push(`/decks/${deck.id}`)}
                        >
                          <AppCard className="w-56 gap-2 bg-surface-soft">
                            <AppText
                              variant="body"
                              className="font-sans-semibold"
                              numberOfLines={1}
                            >
                              {deck.title}
                            </AppText>
                            <AppText
                              variant="caption"
                              className="text-text-muted"
                              numberOfLines={2}
                            >
                              {deck.description ?? "No description yet."}
                            </AppText>
                            <View className="flex-row gap-3">
                              <AppText
                                variant="caption"
                                className="text-text-muted"
                              >
                                Cards {deck.card_count}
                              </AppText>
                              <AppText
                                variant="caption"
                                className="text-text-muted"
                              >
                                Questions {deck.question_count}
                              </AppText>
                            </View>
                          </AppCard>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            ))
          )}
        </View>
      )}

      <ConfirmDialog
        visible={pendingRemove !== null}
        title="Remove friend?"
        description={`Remove ${pendingRemove?.name ?? "this friend"}? You can re-add them later.`}
        confirmTitle="Remove"
        loadingTitle="Removing..."
        loading={removingId !== null}
        onCancel={() => {
          if (!removingId) setPendingRemove(null);
        }}
        onConfirm={async () => {
          if (!pendingRemove) return;
          setRemovingId(pendingRemove.id);
          try {
            await friends.removeFriend(pendingRemove.id);
            await sharedLibrary.refresh();
            setPendingRemove(null);
          } finally {
            setRemovingId(null);
          }
        }}
      />
    </Screen>
  );
}
