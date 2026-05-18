import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, PanResponder, ScrollView, View } from "react-native";
import {
  Add01Icon,
  BookOpen02Icon,
  Cancel01Icon,
  Delete01Icon,
  Edit01Icon,
  MoreHorizontalIcon,
  Quiz02Icon,
  UserAdd01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import {
  AppButton,
  AppCard,
  AppText,
  ConfirmDialog,
  DraggableBottomSheet,
  EmptyState,
  LoadingState,
  NavLink,
  Screen,
  SectionHeader,
  StaticFlashcard,
} from "@/components";
import { AvatarStack, MetaPill, PastelImageFallback } from "@/components";
import { useDeckCollaborators } from "@/hooks/useDeckCollaborators";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { useDeckGeneration } from "@/hooks/useDeckGeneration";
import { useFriends } from "@/hooks/useFriends";
import { useQuestions } from "@/hooks/useQuestions";
import { getErrorMessage } from "@/lib/errors";
import { leaveDeck, type CollaboratorRole } from "@/services/deckCollaborators";
import { deleteDeckWithCoverImage } from "@/services/decks";

const STACK_VISIBLE_COUNT = 3;
const SWIPE_THRESHOLD = 80;

export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId, generate } = useLocalSearchParams<{
    deckId: string;
    generate?: string;
  }>();

  const [pendingDelete, setPendingDelete] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("viewer");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [queue, setQueue] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const [activeCollaboratorId, setActiveCollaboratorId] = useState<
    string | null
  >(null);
  const [collaboratorActionOpen, setCollaboratorActionOpen] = useState(false);
  const [pendingCollaboratorRemoveId, setPendingCollaboratorRemoveId] =
    useState<string | null>(null);
  const [mutatingCollaborator, setMutatingCollaborator] = useState(false);

  const { deck, loading, error, refresh } = useDeckDetail(deckId);
  const questions = useQuestions(deckId);
  const generation = useDeckGeneration(deckId);
  const collaborators = useDeckCollaborators(deckId);
  const { friends } = useFriends();

  const generationStarted = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const topCardTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const randomRotationMap = useRef<Map<string, number>>(new Map());

  const coverUrl = deck?.cover_image_url ?? deck?.cover_url;
  const canEditCards =
    deck?.permission === "owner" || deck?.permission === "editor";
  const canManageDeck = deck?.permission === "owner";
  const isReady = deck?.status === "Ready";
  const isPreparing = deck?.status === "Preparing" || generation.generating;

  const acceptedCollaborators = collaborators.collaborators.filter(
    (item) => item.status === "accepted",
  );
  const acceptedNonOwnerCollaborators = acceptedCollaborators.filter(
    (item) => item.role !== "owner",
  );

  const topCardId = queue[0] ?? null;
  const topCard = topCardId
    ? (deck?.cards.find((card) => card.id === topCardId) ?? null)
    : null;
  const activeCollaborator =
    acceptedCollaborators.find((item) => item.id === activeCollaboratorId) ??
    null;

  const currentCardIndex = useMemo(() => {
    if (!deck?.cards.length || !topCardId) return 0;
    const idx = deck.cards.findIndex((card) => card.id === topCardId);
    return idx < 0 ? 0 : idx;
  }, [deck?.cards, topCardId]);

  const stackedCards = useMemo(() => {
    if (!deck?.cards.length || !queue.length) return [];

    return queue
      .slice(0, STACK_VISIBLE_COUNT)
      .map((id) => deck.cards.find((card) => card.id === id))
      .filter(Boolean) as NonNullable<typeof topCard>[];
  }, [deck?.cards, queue]);

  function getStableRotation(cardId: string) {
    const existing = randomRotationMap.current.get(cardId);
    if (typeof existing === "number") return existing;

    const value = Math.random() * 8 - 4;
    randomRotationMap.current.set(cardId, value);
    return value;
  }

  function advanceTopCard() {
    setQueue((prevQueue) => {
      if (prevQueue.length <= 1) return prevQueue;

      const [first, ...rest] = prevQueue;
      setHistory((prevHistory) => [...prevHistory, first]);
      return [...rest, first];
    });
  }

  function undoTopCard() {
    setHistory((prevHistory) => {
      if (!prevHistory.length) return prevHistory;

      const previousTop = prevHistory[prevHistory.length - 1];
      setQueue((prevQueue) => {
        const withoutPrevious = prevQueue.filter((id) => id !== previousTop);
        return [previousTop, ...withoutPrevious];
      });

      return prevHistory.slice(0, -1);
    });
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,
        onPanResponderMove: (_, gesture) => {
          topCardTranslate.setValue({ x: gesture.dx, y: gesture.dy * 0.2 });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx <= -SWIPE_THRESHOLD) {
            Animated.timing(topCardTranslate, {
              toValue: { x: -220, y: 20 },
              duration: 140,
              useNativeDriver: false,
            }).start(() => {
              topCardTranslate.setValue({ x: 0, y: 0 });
              advanceTopCard();
            });
            return;
          }

          if (gesture.dx >= SWIPE_THRESHOLD) {
            Animated.timing(topCardTranslate, {
              toValue: { x: 220, y: 20 },
              duration: 140,
              useNativeDriver: false,
            }).start(() => {
              topCardTranslate.setValue({ x: 0, y: 0 });
              undoTopCard();
            });
            return;
          }

          Animated.spring(topCardTranslate, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
      }),
    [topCardTranslate],
  );

  useEffect(() => {
    if (generate !== "1" || !deckId || generationStarted.current) return;

    generationStarted.current = true;
    generation
      .generate()
      .catch(() => null)
      .finally(() => {
        void refresh();
        void questions.refresh();
      });
  }, [deckId, generate, generation, questions, refresh]);

  useEffect(() => {
    const ids = (deck?.cards ?? []).map((card) => card.id);
    setQueue(ids);
    setHistory([]);
  }, [deck?.cards]);

  async function handleDeleteDeck() {
    if (!deck) return;

    setDeleting(true);
    setDeleteWarning(null);
    setDeleteError(null);

    try {
      const result = await deleteDeckWithCoverImage(deck);
      if (result.coverDeleteWarning) {
        setDeleteWarning(result.coverDeleteWarning);
      }
      setDeleted(true);
      router.replace("/(tabs)/library");
    } catch (caught) {
      setDeleteError(getErrorMessage(caught, "Could not delete deck."));
    } finally {
      setDeleting(false);
    }
  }

  async function handleRetryGeneration() {
    try {
      await generation.generate();
    } finally {
      await refresh();
      await questions.refresh();
    }
  }

  async function handleInvite(userId: string) {
    setInvitingId(userId);
    try {
      await collaborators.inviteFriend(userId, inviteRole);
    } finally {
      setInvitingId(null);
    }
  }

  async function handleLeaveDeck() {
    const myEntry = collaborators.collaborators.find(
      (c) => c.status === "accepted" && deck?.permission !== "owner",
    );
    if (!myEntry) return;

    setLeaving(true);
    try {
      await leaveDeck(myEntry.id);
      router.replace("/(tabs)/library");
    } finally {
      setLeaving(false);
    }
  }

  async function handleChangeCollaboratorRole(role: CollaboratorRole) {
    if (!activeCollaborator || activeCollaborator.role === "owner") return;

    setMutatingCollaborator(true);
    try {
      await collaborators.changeRole(activeCollaborator.id, role);
      setCollaboratorActionOpen(false);
      setActiveCollaboratorId(null);
    } finally {
      setMutatingCollaborator(false);
    }
  }

  async function handleRemoveCollaborator(collaboratorId: string) {
    setMutatingCollaborator(true);
    try {
      await collaborators.removeCollaborator(collaboratorId);
      setPendingCollaboratorRemoveId(null);
      setCollaboratorActionOpen(false);
      setActiveCollaboratorId(null);
    } finally {
      setMutatingCollaborator(false);
    }
  }

  const alreadyInvitedIds = new Set(
    collaborators.collaborators.map((c) => c.user_id),
  );

  if (deleted) {
    return <Redirect href="/(tabs)/library" />;
  }

  return (
    <Screen
      header={
        <SectionHeader variant="detail" title={deck?.title || "Deck"}>
          <AppButton
            title="Actions"
            layout="icon-only"
            icon={MoreHorizontalIcon}
            variant="outline"
            className="h-10 min-h-10 w-10 rounded-full bg-surface-soft"
            disabled={!deck || deleting}
            onPress={() => setActionSheetOpen(true)}
          />
        </SectionHeader>
      }
      scroll
      contentClassName="pb-32"
    >
      {loading ? <LoadingState label="Loading deck..." /> : null}
      {/* {error ? (
        <AppText variant="caption" className="text-center text-danger">
          {error}
        </AppText>
      ) : null}
      {generation.error ? (
        <AppText variant="caption" className="text-center text-danger">
          {generation.error}
        </AppText>
      ) : null}
      {deleteError ? (
        <AppText variant="caption" className="text-center text-danger">
          {deleteError}
        </AppText>
      ) : null}
      {deleteWarning ? (
        <AppText variant="caption" className="text-center text-danger">
          {deleteWarning}
        </AppText>
      ) : null} */}

      {deck ? (
        <>
          <View className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            {coverUrl ? (
              <Image
                source={{ uri: coverUrl }}
                className="h-56 w-full bg-surface-soft"
              />
            ) : (
              <PastelImageFallback title={deck.title} className="h-56" />
            )}
          </View>
          <View className="gap-1">
            <AppText variant="title">{deck.title}</AppText>
            <AppText variant="body" className="text-text-muted">
              {deck.description ?? "No description yet."}
            </AppText>
          </View>
          <View className="gap-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {deck.topics?.name ? (
                <View className="self-start rounded-full bg-mint-soft px-3 py-1">
                  <AppText
                    variant="caption"
                    className="font-sans-medium text-text"
                  >
                    {deck.topics.name}
                  </AppText>
                </View>
              ) : null}

              <View className="rounded-full border border-border bg-surface-soft px-3 py-1 self-start">
                <AppText
                  variant="caption"
                  className="font-sans-semibold text-text"
                >
                  {deck.status}
                </AppText>
              </View>
            </View>
            <View className="flex-row items-center justify-between gap-3 ml-auto">
              <View className="flex-row flex-wrap items-center gap-2">
                <MetaPill icon={BookOpen02Icon} label={`${deck.card_count}`} />
                <MetaPill
                  icon={Quiz02Icon}
                  label={`${questions.questions.length || deck.question_count}`}
                />
                <MetaPill
                  icon={UserGroupIcon}
                  label={`${acceptedCollaborators.length}`}
                />
              </View>
              <AvatarStack
                collaborators={acceptedNonOwnerCollaborators.map(
                  (item) => item.profile,
                )}
                maxVisible={2}
              />
            </View>

            {deck.generation_error ? (
              <AppText variant="caption" className="text-danger">
                {deck.generation_error}
              </AppText>
            ) : null}
          </View>

          <View className="flex-row flex-wrap gap-3">
            <View className="min-w-[46%] flex-1">
              {isReady && questions.questions.length > 0 ? (
                <NavLink
                  layout="icon-leading"
                  icon={Quiz02Icon}
                  href={`/quiz?deckId=${deck.id}`}
                  title="Start quiz"
                  variant="primary"
                />
              ) : (
                <AppButton
                  layout="icon-leading"
                  icon={Quiz02Icon}
                  title="Start quiz"
                  variant="primary"
                  disabled
                />
              )}
            </View>
            <View className="min-w-[46%] flex-1">
              {isReady ? (
                <NavLink
                  href={`/study?deckId=${deck.id}`}
                  layout="icon-leading"
                  icon={BookOpen02Icon}
                  title="Learn"
                  variant="secondary"
                />
              ) : (
                <AppButton
                  title={isPreparing ? "Preparing..." : "Review cards"}
                  disabled
                  layout="icon-leading"
                  icon={BookOpen02Icon}
                  variant="secondary"
                />
              )}
            </View>

            {deck.status === "Failed" ? (
              <View className="min-w-[46%] flex-1">
                <AppButton
                  title={
                    generation.generating ? "Retrying..." : "Retry generation"
                  }
                  variant="secondary"
                  disabled={generation.generating}
                  onPress={() => void handleRetryGeneration()}
                />
              </View>
            ) : null}
          </View>

          {canManageDeck || acceptedCollaborators.length > 0 ? (
            <View className="gap-3">
              <AppText variant="subtitle">Collaborators</AppText>
              {collaborators.loading ? (
                <LoadingState />
              ) : acceptedCollaborators.length === 0 ? (
                <EmptyState
                  title="No collaborators"
                  description="Invite friends to view or edit this deck."
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-4 px-1"
                >
                  {acceptedCollaborators.map((c) => {
                    const name =
                      c.profile?.display_name ?? c.profile?.email ?? "User";
                    const initial = name.slice(0, 1).toUpperCase();

                    return (
                      <View key={c.id} className="w-20 items-center gap-2">
                        {c.profile?.avatar_url ? (
                          <Image
                            source={{ uri: c.profile.avatar_url }}
                            className="size-16 rounded-full bg-surface-soft"
                          />
                        ) : (
                          <View className="size-16 items-center justify-center rounded-full bg-lavender-soft">
                            <AppText variant="subtitle">{initial}</AppText>
                          </View>
                        )}

                        <AppText
                          variant="caption"
                          className="text-center font-sans-medium text-text"
                          numberOfLines={1}
                        >
                          {name}
                        </AppText>
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : null}
          {/* 
          <View className="gap-3">
            <AppText variant="subtitle">Cards</AppText>
            {isPreparing ? (
              <EmptyState
                title="Preparing content"
                description="AI is creating cards and questions for this deck."
              />
            ) : null}

            {topCard ? (
              <>
                <View className="h-[380px] w-full items-center justify-center">
                  {stackedCards
                    .slice()
                    .reverse()
                    .map((card, layerIndex, reversedArray) => {
                      const realIndex = reversedArray.length - 1 - layerIndex;
                      const isTop = realIndex === 0;
                      const rotation = getStableRotation(card.id);

                      const baseScale = 1 - realIndex * 0.04;
                      const baseTranslateY = realIndex * 12;
                      const baseOpacity = 1 - realIndex * 0.16;

                      const animatedStyle = isTop
                        ? {
                            transform: [
                              { translateX: topCardTranslate.x },
                              {
                                translateY: Animated.add(
                                  topCardTranslate.y,
                                  new Animated.Value(baseTranslateY),
                                ),
                              },
                              {
                                rotate: topCardTranslate.x.interpolate({
                                  inputRange: [-160, 0, 160],
                                  outputRange: [
                                    `${rotation - 8}deg`,
                                    `${rotation}deg`,
                                    `${rotation + 8}deg`,
                                  ],
                                  extrapolate: "clamp",
                                }),
                              },
                              { scale: baseScale },
                            ],
                            opacity: baseOpacity,
                            zIndex: 30,
                          }
                        : {
                            transform: [
                              { translateY: baseTranslateY },
                              { rotate: `${rotation}deg` },
                              { scale: baseScale },
                            ],
                            opacity: baseOpacity,
                            zIndex: 30 - realIndex,
                          };

                      return (
                        <Animated.View
                          key={card.id}
                          style={[
                            {
                              position: "absolute",
                              width: "100%",
                            },
                            animatedStyle,
                          ]}
                          {...(isTop ? panResponder.panHandlers : {})}
                        >
                          <Pressable
                            onPress={() => {
                              if (!isTop) return;
                              advanceTopCard();
                            }}
                          >
                            <StaticFlashcard
                              front={card.front ?? "Untitled card"}
                              back={card.back ?? "No definition yet."}
                              explanation={card.explanation}
                              tags={card.tags}
                            />
                          </Pressable>
                        </Animated.View>
                      );
                    })}
                </View>
                <AppText
                  variant="caption"
                  className="text-center text-text-muted"
                >
                  {currentCardIndex + 1} / {deck.cards.length}
                </AppText>
              </>
            ) : !isPreparing ? (
              <EmptyState
                title="No cards yet"
                description="Add the first card for this deck."
              />
            ) : null}
          </View> */}

          {!canManageDeck && deck.permission !== "owner" ? (
            <AppButton
              title="Leave deck"
              variant="destructive"
              icon={Cancel01Icon}
              layout="icon-leading"
              className="justify-start rounded-lg bg-surface px-4"
              onPress={() => setLeaveConfirm(true)}
            />
          ) : null}
        </>
      ) : null}

      <DraggableBottomSheet
        visible={actionSheetOpen}
        title="Deck actions"
        onClose={() => setActionSheetOpen(false)}
      >
        {deck ? (
          <View className="gap-2">
            {canEditCards ? (
              <AppButton
                title="Add card"
                icon={Add01Icon}
                layout="icon-leading"
                variant="ghost"
                className="justify-start rounded-lg bg-surface px-4"
                onPress={() => {
                  setActionSheetOpen(false);
                  router.push(`/cards/edit?deckId=${deck.id}`);
                }}
              />
            ) : null}

            {canManageDeck ? (
              <>
                <AppButton
                  title="Edit deck"
                  icon={Edit01Icon}
                  layout="icon-leading"
                  variant="ghost"
                  className="justify-start rounded-lg bg-surface px-4"
                  onPress={() => {
                    setActionSheetOpen(false);
                    router.push(`/decks/${deck.id}/edit`);
                  }}
                />

                <AppButton
                  title="Invite friend"
                  icon={UserAdd01Icon}
                  layout="icon-leading"
                  variant="ghost"
                  className="justify-start rounded-lg bg-surface px-4"
                  onPress={() => {
                    setActionSheetOpen(false);
                    setInviteSheetOpen(true);
                  }}
                />

                <View className="h-px bg-border" />

                <AppButton
                  title={deleting ? "Deleting..." : "Delete deck"}
                  icon={Delete01Icon}
                  layout="icon-leading"
                  variant="destructive"
                  className="justify-start rounded-lg bg-surface px-4"
                  disabled={deleting}
                  onPress={() => {
                    setActionSheetOpen(false);
                    setPendingDelete(true);
                  }}
                />
              </>
            ) : null}
          </View>
        ) : null}
      </DraggableBottomSheet>

      <ConfirmDialog
        visible={pendingDelete}
        title="Delete deck?"
        description="Are you sure you want to delete this deck? This action cannot be undone."
        confirmTitle="Delete"
        loadingTitle="Deleting..."
        loading={deleting}
        onCancel={() => {
          if (!deleting) setPendingDelete(false);
        }}
        onConfirm={() => {
          void handleDeleteDeck();
        }}
      />

      <ConfirmDialog
        visible={leaveConfirm}
        title="Leave deck?"
        description="You will lose access to this shared deck."
        confirmTitle="Leave"
        loadingTitle="Leaving..."
        loading={leaving}
        onCancel={() => {
          if (!leaving) setLeaveConfirm(false);
        }}
        onConfirm={() => void handleLeaveDeck()}
      />

      <ConfirmDialog
        visible={Boolean(pendingCollaboratorRemoveId)}
        title="Remove collaborator?"
        description="This collaborator will lose access to this deck."
        confirmTitle="Remove"
        loadingTitle="Removing..."
        loading={mutatingCollaborator}
        onCancel={() => {
          if (!mutatingCollaborator) setPendingCollaboratorRemoveId(null);
        }}
        onConfirm={() => {
          if (!pendingCollaboratorRemoveId) return;
          void handleRemoveCollaborator(pendingCollaboratorRemoveId);
        }}
      />

      <DraggableBottomSheet
        visible={inviteSheetOpen}
        title="Invite a friend"
        onClose={() => setInviteSheetOpen(false)}
      >
        <View className="gap-4">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <AppButton
                title="Viewer"
                variant={inviteRole === "viewer" ? "primary" : "secondary"}
                onPress={() => setInviteRole("viewer")}
              />
            </View>
            <View className="flex-1">
              <AppButton
                title="Editor"
                variant={inviteRole === "editor" ? "primary" : "secondary"}
                onPress={() => setInviteRole("editor")}
              />
            </View>
          </View>

          {friends.length === 0 ? (
            <EmptyState
              title="No friends yet"
              description="Add friends from the Friends tab first."
            />
          ) : (
            <View className="gap-2">
              {friends.map((f) => {
                const alreadyIn = alreadyInvitedIds.has(f.friend.id);
                const isInviting = invitingId === f.friend.id;
                return (
                  <AppCard key={f.id} className="rounded-lg">
                    <View className="flex-row items-center gap-3">
                      {f.friend.avatar_url ? (
                        <Image
                          source={{ uri: f.friend.avatar_url }}
                          className="size-10 rounded-lg bg-surface-soft"
                        />
                      ) : (
                        <View className="size-10 items-center justify-center rounded-lg bg-lavender-soft">
                          <AppText
                            variant="caption"
                            className="font-sans-semibold"
                          >
                            {(f.friend.display_name ?? f.friend.email ?? "F")
                              .slice(0, 1)
                              .toUpperCase()}
                          </AppText>
                        </View>
                      )}
                      <View className="flex-1">
                        <AppText
                          variant="body"
                          className="font-sans-semibold"
                          numberOfLines={1}
                        >
                          {f.friend.display_name ?? f.friend.email ?? "Friend"}
                        </AppText>
                        <AppText
                          variant="caption"
                          className="text-text-muted"
                          numberOfLines={1}
                        >
                          {f.friend.email ?? ""}
                        </AppText>
                      </View>
                      {alreadyIn ? (
                        <View className="rounded-full bg-mint-soft px-3 py-1">
                          <AppText variant="caption">Invited</AppText>
                        </View>
                      ) : (
                        <AppButton
                          title={isInviting ? "..." : "Invite"}
                          variant="secondary"
                          icon={UserAdd01Icon}
                          layout="icon-leading"
                          className="h-9 min-h-9 rounded-full px-3"
                          disabled={isInviting}
                          onPress={() => void handleInvite(f.friend.id)}
                        />
                      )}
                    </View>
                  </AppCard>
                );
              })}
            </View>
          )}
        </View>
      </DraggableBottomSheet>

      <DraggableBottomSheet
        visible={collaboratorActionOpen}
        title="Collaborator actions"
        onClose={() => {
          if (mutatingCollaborator) return;
          setCollaboratorActionOpen(false);
          setActiveCollaboratorId(null);
        }}
      >
        {activeCollaborator ? (
          <View className="gap-2">
            {activeCollaborator.role !== "viewer" ? (
              <AppButton
                title="Change permission to Viewer"
                icon={Edit01Icon}
                layout="icon-leading"
                variant="ghost"
                className="justify-start rounded-lg bg-surface px-4"
                disabled={mutatingCollaborator}
                onPress={() => void handleChangeCollaboratorRole("viewer")}
              />
            ) : null}

            {activeCollaborator.role !== "editor" ? (
              <AppButton
                title="Change permission to Editor"
                icon={Edit01Icon}
                layout="icon-leading"
                variant="ghost"
                className="justify-start rounded-lg bg-surface px-4"
                disabled={mutatingCollaborator}
                onPress={() => void handleChangeCollaboratorRole("editor")}
              />
            ) : null}

            <View className="h-px bg-border" />

            <AppButton
              title="Remove collaborator"
              icon={Cancel01Icon}
              layout="icon-leading"
              variant="destructive"
              className="justify-start rounded-lg bg-surface px-4"
              disabled={mutatingCollaborator}
              onPress={() =>
                setPendingCollaboratorRemoveId(activeCollaborator.id)
              }
            />
          </View>
        ) : null}
      </DraggableBottomSheet>
    </Screen>
  );
}
