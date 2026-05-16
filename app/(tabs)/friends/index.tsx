import { useState } from "react";
import { View } from "react-native";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Delete01Icon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

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
import { useDeckInvites } from "@/hooks/useDeckInvites";
import { useFriendSearch, useFriends } from "@/hooks/useFriends";
import { colors } from "@/constants/theme";

export default function FriendsScreen() {
  const friends = useFriends();
  const { query, results, loading: searching, search } = useFriendSearch();
  const invites = useDeckInvites();

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
    } finally {
      setActionLoading(null);
    }
  }

  const friendIds = new Set(friends.friends.map((f) => f.friend.id));
  const outgoingIds = new Set(friends.outgoing.map((f) => f.friend.id));

  return (
    <Screen
      header={<SectionHeader title="Friends" />}
      scroll
      contentClassName="pb-32"
    >
      {/* Search */}
      <AppInput
        placeholder="Search by name or email..."
        value={query}
        onChangeText={search}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Search results */}
      {isSearching ? (
        <View className="gap-3">
          <AppText variant="subtitle">Search results</AppText>
          {searching ? (
            <AppText variant="caption" className="text-center text-text-muted">
              Searching...
            </AppText>
          ) : results.length === 0 ? (
            <EmptyState title="No users found" description="Try a different name or email." />
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
                        <AppText variant="caption" className="text-text-muted">
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
          {/* Pending deck invites */}
          {invites.invites.length > 0 ? (
            <View className="gap-3">
              <AppText variant="subtitle">
                Deck invites ({invites.invites.length})
              </AppText>
              {invites.invites.map((invite) => {
                const thisLoading = actionLoading === invite.id;
                const inviterName =
                  invite.inviter?.display_name ?? "Someone";
                return (
                  <AppCard key={invite.id} className="gap-3">
                    <View className="gap-1">
                      <AppText variant="body" className="font-sans-semibold">
                        {invite.deck.title}
                      </AppText>
                      <AppText variant="caption" className="text-text-muted">
                        Invited by {inviterName} · {invite.role}
                      </AppText>
                    </View>
                    <View className="flex-row gap-2">
                      <View className="flex-1">
                        <AppButton
                          title={thisLoading ? "..." : "Accept"}
                          variant="primary"
                          icon={CheckmarkCircle01Icon}
                          layout="icon-leading"
                          disabled={thisLoading}
                          onPress={() =>
                            handleAction(invite.id, () =>
                              invites.acceptInvite(invite.id),
                            )
                          }
                        />
                      </View>
                      <View className="flex-1">
                        <AppButton
                          title={thisLoading ? "..." : "Decline"}
                          variant="ghost"
                          icon={Cancel01Icon}
                          layout="icon-leading"
                          disabled={thisLoading}
                          onPress={() =>
                            handleAction(invite.id, () =>
                              invites.rejectInvite(invite.id),
                            )
                          }
                        />
                      </View>
                    </View>
                  </AppCard>
                );
              })}
            </View>
          ) : null}

          {/* Incoming friend requests */}
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
                    name={req.friend.display_name ?? req.friend.email ?? "Unknown"}
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

          {/* Friends list */}
          <View className="gap-3">
            <AppText variant="subtitle">
              Friends ({friends.friends.length})
            </AppText>
            {friends.loading ? (
              <AppText variant="caption" className="text-center text-text-muted">
                Loading...
              </AppText>
            ) : friends.friends.length === 0 ? (
              <EmptyState
                title="No friends yet"
                description="Search for someone above to send a friend request."
              />
            ) : (
              friends.friends.map((f) => {
                const thisLoading = actionLoading === f.id;
                return (
                  <UserItem
                    key={f.id}
                    name={f.friend.display_name ?? f.friend.email ?? "Friend"}
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
                );
              })
            )}
          </View>

          {/* Outgoing requests */}
          {friends.outgoing.length > 0 ? (
            <View className="gap-3">
              <AppText variant="subtitle">Sent requests</AppText>
              {friends.outgoing.map((req) => {
                const thisLoading = actionLoading === req.id;
                return (
                  <UserItem
                    key={req.id}
                    name={req.friend.display_name ?? req.friend.email ?? "Unknown"}
                    subtitle="Pending..."
                    avatarUrl={req.friend.avatar_url}
                    action={
                      <AppButton
                        title={thisLoading ? "..." : "Cancel"}
                        variant="ghost"
                        icon={Cancel01Icon}
                        layout="icon-leading"
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
            setPendingRemove(null);
          } finally {
            setRemovingId(null);
          }
        }}
      />
    </Screen>
  );
}
