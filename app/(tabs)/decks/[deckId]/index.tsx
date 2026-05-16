import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, View } from "react-native";
import {
  AppButton,
  AppCard,
  AppText,
  EmptyState,
  NavLink,
  Screen,
  DraggableBottomSheet,
  StaticFlashcard,
  SectionHeader,
  ConfirmDialog,
} from "@/components";
import { useDeckGeneration } from "@/hooks/useDeckGeneration";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { useQuestions } from "@/hooks/useQuestions";
import { getErrorMessage } from "@/lib/errors";
import { deleteDeckWithCoverImage } from "@/services/decks";
import {
  Add01Icon,
  Delete01Icon,
  Edit01Icon,
  UserAdd01Icon,
  MoreHorizontalIcon,
  BookOpen02Icon,
  Quiz02Icon,
} from "@hugeicons/core-free-icons";
export default function DeckDetailScreen() {
  const router = useRouter();
  const { deckId, generate } = useLocalSearchParams<{
    deckId: string;
    generate?: string;
  }>();
  const [pendingDelete, setPendingDelete] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const { deck, loading, error, refresh } = useDeckDetail(deckId);
  const questions = useQuestions(deckId);
  const generation = useDeckGeneration(deckId);
  const generationStarted = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const coverUrl = deck?.cover_image_url ?? deck?.cover_url;
  const canEditCards =
    deck?.permission === "owner" || deck?.permission === "editor";
  const canManageDeck = deck?.permission === "owner";
  const isReady = deck?.status === "Ready";
  const isPreparing = deck?.status === "Preparing" || generation.generating;

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
      {loading ? (
        <AppText variant="caption" className="text-center">
          Loading deck...
        </AppText>
      ) : null}
      {error ? (
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
      ) : null}

      {deck ? (
        <>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              className="h-56 w-full rounded-lg bg-surface-soft"
            />
          ) : (
            <View className="h-56 w-full items-center justify-center rounded-lg border border-border bg-pink-soft">
              <AppText variant="title">
                {deck.title.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
          )}

          <View className="gap-2">
            <AppText variant="title">{deck.title}</AppText>
            <AppText variant="body" className="text-text-muted">
              {deck.description ?? "No description yet."}
            </AppText>

            <AppText variant="caption">
              {deck.card_count} cards -{" "}
              {questions.questions.length || deck.question_count} questions
            </AppText>

            <View className="flex-row flex-wrap items-center gap-2 mt-3">
              <View className="rounded-sm border border-border bg-yellow-soft px-3 py-1">
                <AppText
                  variant="caption"
                  className="font-sans-semibold text-text"
                >
                  {deck.status}
                </AppText>
              </View>
              {deck.topics?.name ? (
                <View className="rounded-sm border border-lavender bg-lavender-soft px-3 py-1">
                  <AppText
                    variant="caption"
                    className="font-sans-medium text-text"
                  >
                    {deck.topics.name}
                  </AppText>
                </View>
              ) : null}
            </View>
            {deck.generation_error ? (
              <AppText variant="caption" className="text-danger text-center">
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

          <View className="gap-3">
            <AppText variant="subtitle">Cards</AppText>
            {isPreparing ? (
              <EmptyState
                title="Preparing content"
                description="AI is creating cards and questions for this deck."
              />
            ) : null}
            {deck.cards.length ? (
              deck.cards.map((card) => (
                <StaticFlashcard
                  key={card.id}
                  front={card.front ?? "Untitled card"}
                  back={card.back ?? "No definition yet."}
                  explanation={card.explanation}
                  tags={card.tags}
                />
              ))
            ) : !isPreparing ? (
              <EmptyState
                title="No cards yet"
                description="Add the first card for this deck."
              />
            ) : null}
          </View>
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
                className="justify-start rounded-2xl bg-surface px-4"
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
                  className="justify-start rounded-2xl bg-surface px-4"
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
                  className="justify-start rounded-2xl bg-surface px-4"
                  disabled
                  onPress={() => {
                    setActionSheetOpen(false);
                  }}
                />

                <View className="h-px bg-border" />

                <AppButton
                  title={deleting ? "Deleting..." : "Delete deck"}
                  icon={Delete01Icon}
                  layout="icon-leading"
                  variant="destructive"
                  className="justify-start rounded-2xl bg-surface px-4"
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
    </Screen>
  );
}
