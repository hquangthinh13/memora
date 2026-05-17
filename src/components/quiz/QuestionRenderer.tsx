import { useEffect, useMemo, useRef } from "react";
import { Animated, View } from "react-native";
import { Image } from "expo-image";

import type { Question } from "@/services/questions";
import Images from "@/constants/images";
import { cn } from "@/lib/cn";
import { AppText } from "@/components/shared";

type QuestionRendererProps = {
  question: Question;
  index: number;
  total: number;
  timeLeft: number;
  timeLimit: number;
  score: number;
  wrongCount: number;
  backgroundClassName?: string;
  showIllustration?: boolean;
  illustrationNode?: React.ReactNode;
};

const TYPE_LABELS: Record<string, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  fill_in_the_blank: "Fill in the blank",
  short_answer: "Short answer",
};

const TYPE_INSTRUCTIONS: Record<string, string> = {
  mcq: "Choose one answer.",
  true_false: "Decide if the statement is true or false.",
  fill_in_the_blank: "Fill in the missing term.",
  short_answer: "Write a brief answer.",
};

const TYPE_CARD_COLORS: Record<string, string> = {
  mcq: "bg-mint-soft",
  true_false: "bg-peach-soft",
  fill_in_the_blank: "bg-lavender-soft",
  short_answer: "bg-yellow-soft",
};

function renderQuestionText(question: Question) {
  const isClozeQuestion =
    question.type === "fill_in_the_blank" || question.type === "short_answer";

  if (!isClozeQuestion || !/_{2,}/.test(question.question)) {
    return question.question;
  }

  const parts = question.question.split(/_{2,}/);
  const nodes: React.ReactNode[] = [];

  parts.forEach((part, index) => {
    nodes.push(part);
    if (index < parts.length - 1) {
      nodes.push(
        <AppText
          key={`blank-${index}`}
          variant="subtitle"
          className="font-sans-bold text-primary"
        >
          ____
        </AppText>,
      );
    }
  });

  return nodes;
}

export function QuestionRenderer({
  question,
  index,
  total,
  timeLeft,
  timeLimit,
  score,
  wrongCount,
  backgroundClassName,
  showIllustration = true,
  illustrationNode,
}: QuestionRendererProps) {
  const timerPercent = timeLimit ? Math.max(0, timeLeft / timeLimit) : 0;
  const typeLabel =
    TYPE_LABELS[question.type] ?? question.type.replace(/_/g, " ");
  const typeInstruction =
    TYPE_INSTRUCTIONS[question.type] ?? "Answer the question.";
  const hintText =
    typeof question.hint === "string" && question.hint.trim()
      ? question.hint.trim()
      : typeInstruction;
  const panelColor =
    backgroundClassName ?? TYPE_CARD_COLORS[question.type] ?? "bg-mint-soft";

  const timerAnim = useRef(new Animated.Value(timerPercent)).current;

  useEffect(() => {
    Animated.timing(timerAnim, {
      toValue: timerPercent,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [timerAnim, timerPercent]);

  const timerWidth = timerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const timerToneClass = useMemo(() => {
    if (!timeLimit) return "bg-primary";
    if (timerPercent <= 0.25) return "bg-danger";
    if (timerPercent <= 0.5) return "bg-peach";
    return "bg-primary";
  }, [timeLimit, timerPercent]);

  return (
    <View className={cn("overflow-hidden rounded-lg border", panelColor)}>
      <View className="relative gap-4 p-card">
        {showIllustration ? (
          <View className="absolute -right-2 -bottom-2 opacity-55">
            {illustrationNode ?? (
              <Image
                source={Images.floral01}
                style={{ width: 84, height: 84 }}
                contentFit="contain"
              />
            )}
          </View>
        ) : null}

        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <AppText variant="caption" className="font-sans-semibold">
              {typeLabel}
            </AppText>
            <AppText variant="caption" className="font-sans-semibold">
              {timeLimit ? `${timeLeft}s` : "No limit"}
            </AppText>
          </View>

          {timeLimit ? (
            <View className="mt-1 h-2 overflow-hidden rounded-lg bg-surface/80">
              <Animated.View
                className={cn("h-full rounded-lg", timerToneClass)}
                style={{ width: timerWidth }}
              />
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <View className="self-center rounded-lg bg-surface/70 px-3 py-2">
            <AppText
              variant="caption"
              className="text-center font-sans-semibold text-text-muted"
            >
              {hintText}
            </AppText>
          </View>
          <AppText variant="subtitle" className="text-center leading-7">
            {renderQuestionText(question)}
          </AppText>
        </View>

        <AppText variant="caption" className="text-center text-text-muted">
          Question {index + 1}/{total}
        </AppText>

        <View className="flex-row items-center justify-between">
          <View className="rounded-full bg-surface/80 px-3 py-1">
            <AppText variant="caption">Correct {score}</AppText>
          </View>
          <View className="rounded-full bg-surface/80 px-3 py-1">
            <AppText variant="caption">Incorrect {wrongCount}</AppText>
          </View>
          <View className="rounded-full bg-surface/80 px-3 py-1">
            <AppText variant="caption">
              Difficulty {question.difficulty}/5
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}
