import { Image } from "expo-image";
import { View } from "react-native";

import Images from "@/constants/images";
import { AppCard, AppText } from "@/components/shared";

type QuizResultSummaryCardProps = {
  score: number;
  total: number;
  percent: number;
  correctCount: number;
  incorrectCount: number;
  timedOutCount: number;
};

export function QuizResultSummaryCard({
  score,
  total,
  percent,
  correctCount,
  incorrectCount,
  timedOutCount,
}: QuizResultSummaryCardProps) {
  return (
    <AppCard className="relative gap-4 overflow-hidden bg-mint-soft border-mint/50">
      <Image
        source={Images.floral01}
        style={{
          position: "absolute",
          right: 0,
          bottom: 12,
          width: 96,
          height: 96,
          opacity: 1,
        }}
        contentFit="contain"
      />

      <View>
        <AppText variant="subtitle">Quiz complete</AppText>
        <AppText variant="title" className="mt-1 text-4xl">
          {score}/{total}
        </AppText>
        <AppText variant="caption" className="mt-1 text-text-muted">
          {percent}% correct
        </AppText>
      </View>
      {/* 
      <View className="flex-row flex-wrap gap-4">
        <AppText variant="caption">Correct {correctCount}</AppText>
        <AppText variant="caption">Incorrect {incorrectCount}</AppText>
        {timedOutCount > 0 ? (
          <AppText variant="caption">Timed out {timedOutCount}</AppText>
        ) : null}
      </View> */}
    </AppCard>
  );
}
