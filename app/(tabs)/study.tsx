import { useLocalSearchParams } from "expo-router";

import { AppButton, AppCard, AppText, LearningFlashcard, NavLink, Screen } from "@/components";
import { useStudySession } from "@/hooks/useStudySession";

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const session = useStudySession(deckId);

  return (
    <Screen scroll>
      <AppText variant="title">Study</AppText>

      {!deckId ? (
        <AppCard>
          <AppText variant="subtitle">Choose a deck first</AppText>
          <AppText variant="caption" className="mt-2">
            Open a deck and start studying from there.
          </AppText>
        </AppCard>
      ) : null}

      {session.loading ? <AppText variant="caption">Loading cards...</AppText> : null}
      {session.error ? <AppText variant="caption" className="text-danger">{session.error}</AppText> : null}

      {session.done ? (
        <AppCard className="gap-3 bg-mint">
          <AppText variant="subtitle">Session complete</AppText>
          <AppText variant="body" className="text-text-muted">
            Nice work. Your progress has been saved.
          </AppText>
          <NavLink href={`/decks/${deckId}`} title="Back to deck" />
        </AppCard>
      ) : null}

      {session.currentCard && !session.done ? (
        <>
          <AppCard className="gap-4 bg-lavender">
            <AppText variant="caption">
              Card {session.index + 1} of {session.total}
            </AppText>
          </AppCard>

          <LearningFlashcard
            front={session.currentCard.front ?? "Untitled card"}
            back={session.currentCard.back ?? "No answer yet."}
            flipped={session.answerVisible}
            onPress={session.reveal}
          />

          {!session.answerVisible ? (
            <AppButton title="Reveal answer" variant="primary" onPress={session.reveal} />
          ) : (
            <>
              <AppButton title="I knew it" variant="primary" onPress={() => void session.answer(true)} />
              <AppButton title="Review again" onPress={() => void session.answer(false)} />
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}
