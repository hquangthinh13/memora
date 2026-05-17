import { View } from "react-native";

import { AppCard, AppText } from "@/components/shared";

type BreakdownEntry = {
  type: string;
  label: string;
  correct: number;
  total: number;
  percent: number;
  toneClassName: string;
};

type QuizTypeBreakdownProps = {
  entries: BreakdownEntry[];
};

export function QuizTypeBreakdown({ entries }: QuizTypeBreakdownProps) {
  if (entries.length === 0) return null;

  return (
    <AppCard className="gap-3">
      <AppText variant="subtitle">Breakdown by type</AppText>
      <View className="gap-3">
        {entries.map((entry) => (
          <View key={entry.type} className="gap-2">
            <View className="flex-row items-center justify-between">
              <View className={`rounded-full px-3 py-1 ${entry.toneClassName}`}>
                <AppText variant="caption" className="font-sans-semibold">
                  {entry.label}
                </AppText>
              </View>
              <AppText variant="caption" className="text-text-muted">
                {entry.correct}/{entry.total} ({entry.percent}%)
              </AppText>
            </View>

            <View className="h-2 overflow-hidden rounded-full bg-surface-soft">
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${entry.percent}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    </AppCard>
  );
}
