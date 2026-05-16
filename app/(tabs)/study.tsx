import { View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import Images from "@/constants/images";

import {
  AppButton,
  AppCard,
  AppText,
  LearningFlashcard,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { useStudySession } from "@/hooks/useStudySession";

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const session = useStudySession(deckId);

  return (
    <Screen
      header={
        <SectionHeader
          backHref={`/decks/${deckId}`}
          variant="detail"
          title={"Study session"}
        />
      }
    >
      <View className="flex-1 gap-4">
        {!deckId ? (
          <AppCard>
            <AppText variant="subtitle">Choose a deck first</AppText>
            <AppText variant="caption" className="mt-2">
              Open a deck and start studying from there.
            </AppText>
          </AppCard>
        ) : null}

        {session.loading ? (
          <AppText variant="caption" className="text-center">
            Loading cards...
          </AppText>
        ) : null}

        {session.error ? (
          <AppText variant="caption" className="text-danger">
            {session.error}
          </AppText>
        ) : null}

        {session.done ? (
          <View className="flex-1 justify-center gap-6 px-2">
            <AppCard className="items-center gap-5 px-6 py-8">
              <Image
                source={Images.floral01}
                style={{ width: 176, height: 176 }}
                contentFit="contain"
              />
              <View className="items-center gap-2">
                <AppText variant="title" className="text-center">
                  Session complete!
                </AppText>

                <AppText variant="body" className="text-center text-text-muted">
                  Nice work. Your progress has been saved.
                </AppText>
              </View>

              <View className="mt-2 w-full gap-3">
                <AppButton
                  title="Study again"
                  variant="primary"
                  onPress={session.refresh}
                />

                <NavLink href={`/decks/${deckId}`} title="Back to deck" />
              </View>
            </AppCard>
          </View>
        ) : null}
        {session.currentCard && !session.done ? (
          <>
            <View className="flex-1">
              <LearningFlashcard
                cardId={session.currentCard.id}
                front={session.currentCard.front ?? "Untitled card"}
                back={session.currentCard.back ?? "No answer yet."}
                flipped={session.answerVisible}
                onPress={session.toggleAnswer}
              />
            </View>
            <AppText variant="caption" className="text-center">
              Card {session.index + 1} of {session.total}
            </AppText>
          </>
        ) : null}
      </View>
      {session.currentCard && !session.done ? (
        <View className="flex-row gap-3">
          <AppButton
            title="Previous"
            variant="secondary"
            className="flex-1"
            disabled={session.index === 0}
            onPress={session.previous}
          />

          <AppButton
            title="Next"
            variant="primary"
            className="flex-1"
            onPress={session.next}
          />
        </View>
      ) : null}
    </Screen>
  );
}
