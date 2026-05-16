import { View } from "react-native";

import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type ProgressSummaryCardProps = {
  studiedCount: number;
  streakLabel?: string;
  accuracyLabel?: string;
};

export function ProgressSummaryCard({
  studiedCount,
  streakLabel = "0 days",
  accuracyLabel = "No data",
}: ProgressSummaryCardProps) {
  return (
    <AppCard className="gap-4">
      <AppText variant="subtitle">Learning progress</AppText>
      <View className="flex-row gap-3">
        <View className="flex-1 rounded-md bg-mint-soft p-4">
          <AppText variant="title" className="text-2xl">
            {studiedCount}
          </AppText>
          <AppText variant="caption">Cards studied</AppText>
        </View>
        <View className="flex-1 rounded-md bg-peach-soft p-4">
          <AppText variant="title" className="text-2xl">
            {streakLabel}
          </AppText>
          <AppText variant="caption">Streak</AppText>
        </View>
        <View className="flex-1 rounded-md bg-lavender-soft p-4">
          <AppText variant="title" className="text-2xl">
            {accuracyLabel}
          </AppText>
          <AppText variant="caption">Accuracy</AppText>
        </View>
      </View>
    </AppCard>
  );
}
