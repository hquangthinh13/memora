import { useEffect, useMemo, useRef } from "react";
import { Animated, TouchableOpacity, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./AppText";

type LearningFlashcardProps = {
  cardId: string;
  front: string;
  back: string;
  flipped: boolean;
  onPress: () => void;
};

const CARD_THEMES = [
  {
    bg: "bg-lavender-soft",
    border: "border-lavender",
  },
  {
    bg: "bg-mint-soft",
    border: "border-mint",
  },
  {
    bg: "bg-peach-soft",
    border: "border-peach",
  },
  {
    bg: "bg-pink-soft",
    border: "border-pink",
  },
  {
    bg: "bg-yellow-soft",
    border: "border-peach",
  },
];
const getThemeIndex = (value: string) => {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }

  return Math.abs(hash) % CARD_THEMES.length;
};
export function LearningFlashcard({
  cardId,
  front,
  back,
  flipped,
  onPress,
}: LearningFlashcardProps) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotate, {
      toValue: flipped ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [flipped, rotate]);

  const theme = useMemo(() => {
    return CARD_THEMES[getThemeIndex(cardId)];
  }, [cardId]);

  const frontRotateY = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backRotateY = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const baseClass =
    "absolute inset-0 justify-center rounded-3xl border-2 p-card";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.95}
      onPress={onPress}
      className="flex-1"
    >
      <View className="flex-1">
        <Animated.View
          className={cn(baseClass, theme.bg, theme.border)}
          style={{
            backfaceVisibility: "hidden",
            transform: [{ perspective: 1000 }, { rotateY: frontRotateY }],
          }}
        >
          <AppText variant="caption" className="mb-4 text-center">
            Question
          </AppText>

          <AppText variant="subtitle" className="text-center">
            {front}
          </AppText>

          <AppText variant="caption" className="mt-6 text-center">
            Tap to reveal
          </AppText>
        </Animated.View>

        <Animated.View
          className={cn(baseClass, theme.bg, theme.border)}
          style={{
            backfaceVisibility: "hidden",
            transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
          }}
        >
          <AppText variant="caption" className="mb-4 text-center">
            Answer
          </AppText>

          <AppText variant="subtitle" className="text-center">
            {back}
          </AppText>

          <AppText variant="caption" className="mt-6 text-center">
            Tap to hide
          </AppText>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}
