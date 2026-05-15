import { Pressable } from "react-native";

import { AppText } from "./AppText";

type LearningFlashcardProps = {
  front: string;
  back: string;
  flipped: boolean;
  onPress: () => void;
};

export function LearningFlashcard({
  front,
  back,
  flipped,
  onPress,
}: LearningFlashcardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-80 justify-center rounded-3xl border border-border bg-lavender-soft p-card active:opacity-80"
      onPress={onPress}
    >
      <AppText variant="caption" className="mb-4 text-center">
        {flipped ? "Answer" : "Prompt"}
      </AppText>
      <AppText variant="title" className="text-center">
        {flipped ? back : front}
      </AppText>
      <AppText variant="caption" className="mt-6 text-center">
        {flipped ? "Answer revealed" : "Tap card to reveal"}
      </AppText>
    </Pressable>
  );
}
